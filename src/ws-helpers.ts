import type { ServerWebSocket } from "bun";
import { z } from "zod";
import type { WSData, WSHandler } from "./app";

// Extended WSData with heartbeat
interface WSDataWithHeartbeat<DI> extends WSData<DI> {
	heartbeat?: {
		interval: number;
		timer: ReturnType<typeof setInterval> | null;
		alive: boolean;
	};
}

/**
 * Validate a WebSocket message against a Zod schema.
 *
 * @example
 * ```ts
 * import { z } from "zod";
 * import { validateWSMessage } from "@buntok/core";
 *
 * const messageSchema = z.object({
 *   type: z.enum(["chat", "ping", "join"]),
 *   payload: z.string().optional(),
 * });
 *
 * app.ws("/chat", {
 *   message: (ws, message) => {
 *     const result = validateWSMessage(messageSchema, message);
 *
 *     if (!result.success) {
 *       ws.send(JSON.stringify({ error: "Invalid message", details: result.errors }));
 *       return;
 *     }
 *
 *     // result.data is fully typed
 *     switch (result.data.type) {
 *       case "chat": handleChat(ws, result.data.payload); break;
 *       case "ping": ws.send(JSON.stringify({ type: "pong" })); break;
 *       case "join": handleJoin(ws, result.data.payload); break;
 *     }
 *   },
 * });
 * ```
 */
export function validateWSMessage<T>(
	schema: z.ZodSchema<T>,
	message: string | Buffer,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
	const raw = typeof message === "string" ? message : message.toString();

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return {
			success: false,
			errors: new z.ZodError([
				{
					code: "custom",
					message: "Invalid JSON",
					path: [],
				},
			]),
		};
	}

	const result = schema.safeParse(parsed);
	if (result.success) {
		return { success: true, data: result.data };
	}
	return { success: false, errors: result.error };
}

/**
 * Room class for managing WebSocket connections in named groups.
 *
 * @example
 * ```ts
 * import { Room } from "@buntok/core";
 *
 * const rooms = new Map<string, Room>();
 *
 * app.ws("/chat", {
 *   open: (ws) => {
 *     const roomName = ws.data.ctx.query.get("room") || "general";
 *     let room = rooms.get(roomName);
 *     if (!room) {
 *       room = new Room(roomName);
 *       rooms.set(roomName, room);
 *     }
 *     room.join(ws);
 *     ws.data.room = room;
 *   },
 *   message: (ws, msg) => {
 *     ws.data.room?.broadcast(msg, ws);
 *   },
 *   close: (ws) => {
 *     ws.data.room?.leave(ws);
 *   },
 * });
 * ```
 */
export class Room<DI = Record<string, unknown>> {
	public readonly name: string;
	private members = new Set<ServerWebSocket<WSData<DI>>>();

	constructor(name: string) {
		this.name = name;
	}

	/**
	 * Add a WebSocket connection to the room
	 */
	join(ws: ServerWebSocket<WSData<DI>>): void {
		this.members.add(ws);
	}

	/**
	 * Remove a WebSocket connection from the room
	 */
	leave(ws: ServerWebSocket<WSData<DI>>): void {
		this.members.delete(ws);
	}

	/**
	 * Broadcast a message to all members except the sender
	 */
	broadcast(message: string | object, exclude?: ServerWebSocket<WSData<DI>>): void {
		const data = typeof message === "object" ? JSON.stringify(message) : message;
		for (const member of this.members) {
			if (member !== exclude && member.readyState === 1) {
				member.send(data);
			}
		}
	}

	/**
	 * Send a message to all members including the sender
	 */
	sendAll(message: string | object): void {
		const data = typeof message === "object" ? JSON.stringify(message) : message;
		for (const member of this.members) {
			if (member.readyState === 1) {
				member.send(data);
			}
		}
	}

	/**
	 * Get all members in the room
	 */
	getMembers(): ServerWebSocket<WSData<DI>>[] {
		return Array.from(this.members);
	}

	/**
	 * Get the number of members in the room
	 */
	get size(): number {
		return this.members.size;
	}

	/**
	 * Check if the room is empty
	 */
	get isEmpty(): boolean {
		return this.members.size === 0;
	}

	/**
	 * Check if a WebSocket is in the room
	 */
	has(ws: ServerWebSocket<WSData<DI>>): boolean {
		return this.members.has(ws);
	}

	/**
	 * Close all connections in the room
	 */
	closeAll(): void {
		for (const member of this.members) {
			member.close(1000, "Room closed");
		}
		this.members.clear();
	}
}

/**
 * WebSocket heartbeat middleware.
 * Sends periodic pings to detect stale connections.
 *
 * @example
 * ```ts
 * import { wsHeartbeat } from "@buntok/core";
 *
 * app.ws("/chat", {
 *   ...wsHeartbeat(),
 *   open: (ws) => {
 *     console.log("Client connected");
 *   },
 *   message: (ws, msg) => {
 *     // Handle message
 *   },
 * });
 * ```
 */
export function wsHeartbeat<DI = Record<string, unknown>>(
	interval = 30_000,
): WSHandler<DI> {
	return {
		open: (ws) => {
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			wsData.heartbeat = {
				interval,
				timer: null as ReturnType<typeof setInterval> | null,
				alive: true,
			};

			// Start heartbeat
			wsData.heartbeat.timer = setInterval(() => {
				if (!wsData.heartbeat?.alive) {
					// Connection is stale, close it
					ws.close(4000, "Heartbeat timeout");
					return;
				}

				// Mark as not alive until pong is received
				wsData.heartbeat.alive = false;

				// Send ping
				ws.ping();
			}, interval);
		},
		message: (ws) => {
			// Reset alive on any message (including pong)
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			if (wsData.heartbeat) {
				wsData.heartbeat.alive = true;
			}
		},
		close: (ws) => {
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			if (wsData.heartbeat?.timer) {
				clearInterval(wsData.heartbeat.timer);
			}
		},
		drain: (ws) => {
			// Reset alive on drain event
			const wsData = ws.data as WSDataWithHeartbeat<DI>;
			if (wsData.heartbeat) {
				wsData.heartbeat.alive = true;
			}
		},
	};
}

/**
 * WebSocket authentication middleware.
 * Authenticate connections in the open handler and close if unauthorized.
 *
 * @example
 * ```ts
 * import { wsAuth } from "@buntok/core";
 *
 * app.ws("/chat", {
 *   ...wsAuth(async (ws) => {
 *     const token = new URL(ws.data.ctx.request.url).searchParams.get("token");
 *     if (!token) return null;
 *
 *     const user = await verifyToken(token);
 *     return user ? { user } : null;
 *   }),
 *   open: (ws) => {
 *     // ws.data.user is now available (typed as { user: User })
 *     console.log("Authenticated:", ws.data.user);
 *   },
 *   message: (ws, msg) => {
 *     // ws.data.user is available
 *   },
 * });
 * ```
 */
export function wsAuth<DI extends Record<string, unknown>, TAuth = unknown>(
	authenticate: (ws: ServerWebSocket<WSData<DI>>) => Promise<TAuth | null>,
): WSHandler<DI> {
	return {
		open: async (ws) => {
			try {
				const authData = await authenticate(ws);
				if (authData === null) {
					ws.close(4001, "Unauthorized");
					return;
				}
				// Store auth data on ws.data (will be merged by the server)
				(ws.data as unknown as Record<string, unknown>).auth = authData;
			} catch {
				ws.close(4001, "Unauthorized");
			}
		},
	};
}

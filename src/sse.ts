export interface SSEOptions {
	/** Send initial connection event */
	sendInitial?: boolean;
	/** Custom event name for initial connection */
	initialEvent?: string;
	/** Retry timeout in milliseconds (client reconnection) */
	retry?: number;
	/**
	 * Maximum number of concurrent SSE connections.
	 * When exceeded, new connections receive 503 Service Unavailable.
	 * Set to 0 for unlimited (default).
	 */
	maxConnections?: number;
	/**
	 * Callback to replay missed events on reconnection.
	 * Receives the Last-Event-ID header value from the client.
	 * Return an array of messages to replay.
	 */
	onReconnect?: (lastEventId: string) => Promise<SSEMessage[]>;
}

export interface SSEMessage {
	/** Event name */
	event?: string;
	/** Message data */
	data: string | object;
	/** Unique message ID for resumption */
	id?: string | number;
}

/**
 * Global connection tracker for maxConnections enforcement.
 */
const connectionTracker = {
	connections: new Set<SSE>(),
};

export class SSE {
	private controller: ReadableStreamDefaultController | null = null;
	private encoder = new TextEncoder();
	private closed = false;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private lastEventId: string | null = null;

	constructor(
		private request: Request,
		private options: SSEOptions = {},
	) {
		// Capture Last-Event-ID header for reconnection
		this.lastEventId = request.headers.get("last-event-id");
	}

	/**
	 * Create SSE response with ReadableStream
	 */
	connect(): Response {
		// Check maxConnections limit
		const maxConnections = this.options.maxConnections ?? 0;
		if (maxConnections > 0 && connectionTracker.connections.size >= maxConnections) {
			return new Response(
				JSON.stringify({
					error: "Service Unavailable",
					message: "Maximum connections reached. Please try again later.",
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Track this connection
		connectionTracker.connections.add(this);

		const stream = new ReadableStream({
			start: (controller) => {
				this.controller = controller;

				// Send initial connection event
				if (this.options.sendInitial !== false) {
					const eventName = this.options.initialEvent || "connected";
					this.sendMessage({ event: eventName, data: "connected" });
				}

				// Send retry timeout
				if (this.options.retry) {
					this.sendRaw(`retry: ${this.options.retry}\n\n`);
				}

				// Start heartbeat to keep connection alive
				this.startHeartbeat();

				// Handle client disconnect
				this.request.signal.addEventListener("abort", () => {
					this.close();
				});

				// Replay missed events on reconnection
				if (this.lastEventId && this.options.onReconnect) {
					this.replayMissedEvents();
				}
			},
			cancel: () => {
				this.close();
			},
		});

		return new Response(stream, {
			status: 200,
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no", // Disable nginx buffering
			},
		});
	}

	/**
	 * Replay missed events from reconnection
	 */
	private async replayMissedEvents(): Promise<void> {
		if (!this.lastEventId || !this.options.onReconnect) return;

		try {
			const missedEvents = await this.options.onReconnect(this.lastEventId);
			for (const event of missedEvents) {
				this.send(event);
			}
		} catch (error) {
			console.error("SSE reconnect replay error:", error);
		}
	}

	/**
	 * Send a message to the client
	 */
	send(message: SSEMessage): void {
		if (this.closed) return;
		this.sendMessage(message);
	}

	/**
	 * Send a simple data message
	 */
	sendData(data: string | object): void {
		this.send({ data });
	}

	/**
	 * Send a named event
	 */
	sendEvent(event: string, data: string | object): void {
		this.send({ event, data });
	}

	/**
	 * Send a message with ID (for resumption)
	 */
	sendWithId(id: string | number, data: string | object): void {
		this.send({ id, data });
	}

	private disconnectCallbacks: Array<() => void> = [];

	/**
	 * Register a callback to be called when the connection closes
	 */
	onClose(callback: () => void): void {
		this.disconnectCallbacks.push(callback);
	}

	/**
	 * Get the Last-Event-ID header value (for reconnection)
	 */
	getLastEventId(): string | null {
		return this.lastEventId;
	}

	/**
	 * Send raw string to the stream
	 */
	private sendRaw(raw: string): void {
		if (this.closed || !this.controller) return;
		try {
			this.controller.enqueue(this.encoder.encode(raw));
		} catch (_error) {
			this.close();
		}
	}

	/**
	 * Format and send SSE message
	 */
	private sendMessage(message: SSEMessage): void {
		let raw = "";

		if (message.id !== undefined) {
			raw += `id: ${message.id}\n`;
		}
		if (message.event) {
			raw += `event: ${message.event}\n`;
		}

		const data =
			typeof message.data === "object"
				? JSON.stringify(message.data)
				: message.data;

		// SSE spec: data cannot contain \n, split into multiple data lines
		const dataLines = data.split("\n");
		for (const line of dataLines) {
			raw += `data: ${line}\n`;
		}

		raw += "\n";
		this.sendRaw(raw);
	}

	/**
	 * Start heartbeat to keep connection alive
	 */
	private startHeartbeat(): void {
		// Send comment every 30 seconds to keep connection alive
		this.heartbeatInterval = setInterval(() => {
			this.sendRaw(": heartbeat\n\n");
		}, 30000);
	}

	/**
	 * Close the SSE connection
	 */
	close(): void {
		if (this.closed) return;
		this.closed = true;

		// Remove from global tracker
		connectionTracker.connections.delete(this);

		for (const cb of this.disconnectCallbacks) {
			try {
				cb();
			} catch (e) {
				console.error("SSE onClose error:", e);
			}
		}
		this.disconnectCallbacks = [];

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.controller) {
			try {
				this.controller.close();
			} catch (_e) {}
			this.controller = null;
		}
	}

	/**
	 * Check if connection is still open
	 */
	get isConnected(): boolean {
		return !this.closed;
	}

	/**
	 * Get the number of active SSE connections
	 */
	static get activeConnections(): number {
		return connectionTracker.connections.size;
	}

	/**
	 * Get all active SSE connections
	 */
	static getActiveConnections(): ReadonlySet<SSE> {
		return connectionTracker.connections;
	}
}

/**
 * SSE Broadcaster for managing multiple connections.
 *
 * @example
 * ```ts
 * const broadcaster = new SSEBroadcaster();
 *
 * app.get("/events", (ctx) => {
 *   const sse = createSSE(ctx.request);
 *   broadcaster.add(sse);
 *
 *   sse.onClose(() => broadcaster.remove(sse));
 *
 *   return sse.connect();
 * });
 *
 * // Broadcast to all clients
 * broadcaster.broadcast("update", { count: 42 });
 * ```
 */
export class SSEBroadcaster {
	private clients = new Set<SSE>();

	/**
	 * Add an SSE connection to the broadcaster
	 */
	add(sse: SSE): void {
		this.clients.add(sse);
	}

	/**
	 * Remove an SSE connection from the broadcaster
	 */
	remove(sse: SSE): void {
		this.clients.delete(sse);
	}

	/**
	 * Broadcast a named event to all connected clients
	 */
	broadcast(event: string, data: string | object): void {
		for (const client of this.clients) {
			if (client.isConnected) {
				client.sendEvent(event, data);
			} else {
				this.clients.delete(client);
			}
		}
	}

	/**
	 * Broadcast to clients matching a predicate
	 */
	broadcastWhere(
		predicate: (sse: SSE) => boolean,
		event: string,
		data: string | object,
	): void {
		for (const client of this.clients) {
			if (!client.isConnected) {
				this.clients.delete(client);
				continue;
			}
			if (predicate(client)) {
				client.sendEvent(event, data);
			}
		}
	}

	/**
	 * Send a message to all connected clients
	 */
	sendAll(message: SSEMessage): void {
		for (const client of this.clients) {
			if (client.isConnected) {
				client.send(message);
			} else {
				this.clients.delete(client);
			}
		}
	}

	/**
	 * Close all connections
	 */
	closeAll(): void {
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();
	}

	/**
	 * Get the number of connected clients
	 */
	get size(): number {
		// Clean up disconnected clients
		for (const client of this.clients) {
			if (!client.isConnected) {
				this.clients.delete(client);
			}
		}
		return this.clients.size;
	}

	/**
	 * Check if there are any connected clients
	 */
	get isEmpty(): boolean {
		return this.size === 0;
	}
}

/**
 * Create SSE helper from Buntok context
 */
export function createSSE(request: Request, options?: SSEOptions): SSE {
	return new SSE(request, options);
}

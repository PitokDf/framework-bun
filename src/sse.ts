export interface SSEOptions {
	/** Send initial connection event */
	sendInitial?: boolean;
	/** Custom event name for initial connection */
	initialEvent?: string;
	/** Retry timeout in milliseconds (client reconnection) */
	retry?: number;
}

export interface SSEMessage {
	/** Event name */
	event?: string;
	/** Message data */
	data: string | object;
	/** Unique message ID for resumption */
	id?: string | number;
}

export class SSE {
	private controller: ReadableStreamDefaultController | null = null;
	private encoder = new TextEncoder();
	private closed = false;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

	constructor(
		private request: Request,
		private options: SSEOptions = {},
	) {}

	/**
	 * Create SSE response with ReadableStream
	 */
	connect(): Response {
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

	/**
	 * Send raw string to the stream
	 */
	private sendRaw(raw: string): void {
		if (this.closed || !this.controller) return;
		this.controller.enqueue(this.encoder.encode(raw));
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

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.controller) {
			this.controller.close();
			this.controller = null;
		}
	}

	/**
	 * Check if connection is still open
	 */
	get isConnected(): boolean {
		return !this.closed;
	}
}

/**
 * Create SSE helper from Buntok context
 */
export function createSSE(request: Request, options?: SSEOptions): SSE {
	return new SSE(request, options);
}

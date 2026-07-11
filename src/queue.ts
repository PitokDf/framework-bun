export type JobHandler<T> = (data: T) => Promise<void> | void;

export interface QueueDriver<T> {
	add(data: T): Promise<void>;
	process(handler: JobHandler<T>): void;
}

export class MemoryQueueDriver<T> implements QueueDriver<T> {
	private queue: T[] = [];
	private isProcessing = false;
	private handlers: JobHandler<T>[] = [];

	constructor(public name: string) {}

	process(handler: JobHandler<T>) {
		this.handlers.push(handler);
		this.start();
	}

	async add(data: T) {
		this.queue.push(data);
		this.start();
	}

	private async start() {
		if (this.isProcessing) return;
		this.isProcessing = true;

		// Process loop
		// Using setImmediate or Promise.resolve().then to not block the main thread
		while (this.queue.length > 0) {
			const job = this.queue.shift();
			if (job !== undefined) {
				for (const handler of this.handlers) {
					try {
						await handler(job);
					} catch (err) {
						console.error(`[Queue:${this.name}] Job failed:`, err);
					}
				}
			}
			// Yield to event loop to allow HTTP requests to be handled
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		this.isProcessing = false;
	}
}

export class Queue<T = unknown> {
	constructor(
		public name: string,
		private driver: QueueDriver<T> = new MemoryQueueDriver<T>(name),
	) {}

	async add(data: T) {
		return this.driver.add(data);
	}

	process(handler: JobHandler<T>) {
		this.driver.process(handler);
	}
}

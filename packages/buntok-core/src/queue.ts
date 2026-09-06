// ─── Types ────────────────────────────────────────────────────────────────────

export type JobHandler<T> = (job: Job<T>) => Promise<void> | void;

export interface Job<T> {
	/** Auto-generated unique identifier */
	id: string;
	/** Payload passed by the caller */
	data: T;
	/** Higher number = processed sooner (default: 0) */
	priority: number;
	/** Milliseconds to wait before the job is eligible for processing */
	delay: number;
	/** How many times this job has been attempted (0 = first attempt) */
	attempt: number;
	/** Timestamp when the job was added */
	createdAt: number;
}

export interface QueueOptions {
	/**
	 * Maximum number of retry attempts after the first failure.
	 * Set to 0 (default) to disable retries.
	 */
	maxRetries?: number;
	/**
	 * Base delay in milliseconds between retry attempts (default: 1000).
	 * With `backoff: "exponential"` this value is doubled each attempt.
	 */
	retryDelay?: number;
	/**
	 * Retry backoff strategy.
	 *  - `"fixed"` (default) - always waits `retryDelay` ms
	 *  - `"exponential"` - waits `retryDelay * 2^attempt` ms
	 */
	backoff?: "fixed" | "exponential";
}

export interface QueueDriver<T> {
	add(data: T, opts?: { priority?: number; delay?: number }): Promise<void>;
	process(handler: JobHandler<T>): void;
	size(): number;
	clear(): void;
}

// ─── Memory Driver ────────────────────────────────────────────────────────────

export class MemoryQueueDriver<T> implements QueueDriver<T> {
	private queue: Job<T>[] = [];
	private isProcessing = false;
	private handlers: JobHandler<T>[] = [];
	private readonly opts: Required<QueueOptions>;

	constructor(
		public name: string,
		options: QueueOptions = {},
	) {
		this.opts = {
			maxRetries: options.maxRetries ?? 0,
			retryDelay: options.retryDelay ?? 1000,
			backoff: options.backoff ?? "fixed",
		};
	}

	process(handler: JobHandler<T>) {
		this.handlers.push(handler);
		this.pump();
	}

	async add(
		data: T,
		opts: { priority?: number; delay?: number } = {},
	): Promise<void> {
		const job: Job<T> = {
			id: crypto.randomUUID(),
			data,
			priority: opts.priority ?? 0,
			delay: opts.delay ?? 0,
			attempt: 0,
			createdAt: Date.now(),
		};

		if (job.delay > 0) {
			// Schedule for later
			setTimeout(() => {
				this.enqueue(job);
				this.pump();
			}, job.delay);
		} else {
			this.enqueue(job);
			this.pump();
		}
	}

	private enqueue(job: Job<T>): void {
		// Insert in priority order (higher priority first) using binary search
		if (job.priority === 0 || this.queue.length === 0) {
			this.queue.push(job);
			return;
		}
		let lo = 0;
		let hi = this.queue.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			// biome-ignore lint/style/noNonNullAssertion: bounds checked
			if (this.queue[mid]!.priority >= job.priority) lo = mid + 1;
			else hi = mid;
		}
		this.queue.splice(lo, 0, job);
	}

	private retryDelay(attempt: number): number {
		if (this.opts.backoff === "exponential") {
			return this.opts.retryDelay * 2 ** attempt;
		}
		return this.opts.retryDelay;
	}

	private async pump(): Promise<void> {
		if (this.isProcessing || this.handlers.length === 0) return;
		this.isProcessing = true;

		while (this.queue.length > 0) {
			const job = this.queue.shift();
			if (job === undefined) break;

			for (const handler of this.handlers) {
				try {
					await handler(job);
				} catch (err) {
					const nextAttempt = job.attempt + 1;
					if (nextAttempt <= this.opts.maxRetries) {
						const delay = this.retryDelay(job.attempt);
						console.warn(
							`[Queue:${this.name}] Job ${job.id} failed (attempt ${nextAttempt}/${this.opts.maxRetries + 1}), retrying in ${delay}ms…`,
							err,
						);
						setTimeout(() => {
							this.enqueue({ ...job, attempt: nextAttempt });
							this.pump();
						}, delay);
					} else {
						console.error(
							`[Queue:${this.name}] Job ${job.id} permanently failed after ${nextAttempt} attempt(s):`,
							err,
						);
					}
				}
			}

			// Yield to the event loop between jobs to avoid blocking HTTP requests
			await new Promise((resolve) => setTimeout(resolve, 0));
		}

		this.isProcessing = false;
	}

	/** Number of jobs currently waiting in the queue */
	size(): number {
		return this.queue.length;
	}

	/** Remove all pending jobs from the queue */
	clear(): void {
		this.queue = [];
	}
}

// ─── Queue Driver Options (discriminated union) ────────────────────────────────

export interface RedisDriverOptions {
	/** Use ioredis driver */
	driver: "redis";
	/** ioredis client instance */
	client?: any;
	/** Redis connection URL (used if client not provided) */
	url?: string;
	/** Queue namespace prefix (default: "buntok:queue") */
	prefix?: string;
	/** Max retry attempts (default: 0) */
	maxRetries?: number;
	/** Base retry delay in ms (default: 1000) */
	retryDelay?: number;
	/** Backoff strategy (default: "fixed") */
	backoff?: "fixed" | "exponential";
}

export interface BunRedisDriverOptions {
	/** Use Bun's native Redis client */
	driver: "bun-redis";
	/** Bun.RedisClient instance */
	client?: any;
	/** Redis connection URL (used if client not provided) */
	url?: string;
	/** Queue namespace prefix (default: "buntok:queue") */
	prefix?: string;
	/** Max retry attempts (default: 0) */
	maxRetries?: number;
	/** Base retry delay in ms (default: 1000) */
	retryDelay?: number;
	/** Backoff strategy (default: "fixed") */
	backoff?: "fixed" | "exponential";
}

export interface BullmqDriverOptions {
	/** Use BullMQ driver */
	driver: "bullmq";
	/** BullMQ connection options (default: { host: "localhost", port: 6379 }) */
	connection?: {
		host?: string;
		port?: number;
		url?: string;
		[key: string]: unknown;
	};
	/** Queue namespace prefix (default: "buntok:queue") */
	prefix?: string;
	/** Default job options */
	defaultJobOptions?: {
		attempts?: number;
		backoff?: {
			type?: "fixed" | "exponential";
			delay?: number;
		};
		removeOnComplete?: boolean | { age?: number; count?: number };
		removeOnFail?: boolean | { age?: number; count?: number };
	};
}

export interface RabbitmqDriverOptions {
	/** Use RabbitMQ (AMQP) driver */
	driver: "rabbitmq";
	/** AMQP connection URL (default: "amqp://localhost") */
	url?: string;
	/** Queue name (default: uses queue name from Queue constructor) */
	queue?: string;
	/** Whether queue survives broker restart (default: true) */
	durable?: boolean;
	/** Max unacknowledged messages per consumer (default: 1) */
	prefetch?: number;
	/** Max retry attempts (default: 0) */
	maxRetries?: number;
	/** Base retry delay in ms (default: 1000) */
	retryDelay?: number;
	/** Backoff strategy (default: "fixed") */
	backoff?: "fixed" | "exponential";
}

export type QueueDriverOptions =
	| RedisDriverOptions
	| BunRedisDriverOptions
	| BullmqDriverOptions
	| RabbitmqDriverOptions;

// ─── Queue (high-level API) ────────────────────────────────────────────────────

export class Queue<T = unknown> {
	private driver: QueueDriver<T>;

	/** Redis (ioredis) driver */
	constructor(name: string, options: RedisDriverOptions);
	/** Bun native Redis driver */
	constructor(name: string, options: BunRedisDriverOptions);
	/** BullMQ driver */
	constructor(name: string, options: BullmqDriverOptions);
	/** RabbitMQ driver */
	constructor(name: string, options: RabbitmqDriverOptions);
	/** Custom driver instance */
	constructor(name: string, driver: QueueDriver<T>);
	/** Memory driver (default) */
	constructor(name: string, options?: QueueOptions);
	constructor(
		public name: string,
		driverOrOptions?: QueueDriver<T> | QueueDriverOptions | QueueOptions,
		options?: QueueOptions,
	) {
		if (
			driverOrOptions &&
			typeof (driverOrOptions as QueueDriver<T>).add === "function"
		) {
			this.driver = driverOrOptions as QueueDriver<T>;
		} else if (
			driverOrOptions &&
			"driver" in driverOrOptions
		) {
			this.driver = this.createDriver(driverOrOptions as QueueDriverOptions);
		} else {
			this.driver = new MemoryQueueDriver<T>(
				name,
				(driverOrOptions as QueueOptions) ?? options ?? {},
			);
		}
	}

	private createDriver(options: QueueDriverOptions): QueueDriver<T> {
		// Dynamic imports to keep bundle size small
		switch (options.driver) {
			case "redis": {
				const { RedisQueueDriver } = require("./queue-drivers/redis");
				return new RedisQueueDriver(this.name, options);
			}
			case "bun-redis": {
				const { BunRedisQueueDriver } = require("./queue-drivers/bun-redis");
				return new BunRedisQueueDriver(this.name, options);
			}
			case "bullmq": {
				const { BullmqQueueDriver } = require("./queue-drivers/bullmq");
				return new BullmqQueueDriver(this.name, options);
			}
			case "rabbitmq": {
				const { RabbitmqQueueDriver } = require("./queue-drivers/rabbitmq");
				return new RabbitmqQueueDriver(this.name, options);
			}
			default:
				throw new Error(`Unknown queue driver: ${(options as any).driver}`);
		}
	}

	/**
	 * Add a job to the queue.
	 *
	 * @param data - Job payload
	 * @param opts.priority - Higher numbers are processed first (default: 0)
	 * @param opts.delay - Milliseconds to wait before processing (default: 0)
	 *
	 * @example
	 * await emailQueue.add({ to: "user@example.com" }, { delay: 5000, priority: 10 });
	 */
	async add(
		data: T,
		opts: { priority?: number; delay?: number } = {},
	): Promise<void> {
		return this.driver.add(data, opts);
	}

	/**
	 * Register a handler that processes jobs as they arrive.
	 * The handler now receives the full `Job<T>` object (not just data),
	 * so you can inspect `job.id`, `job.attempt`, `job.createdAt`, etc.
	 *
	 * @example
	 * emailQueue.process(async (job) => {
	 *   console.log(`Attempt ${job.attempt + 1} for job ${job.id}`);
	 *   await sendEmail(job.data.to, job.data.subject);
	 * });
	 */
	process(handler: JobHandler<T>): void {
		this.driver.process(handler);
	}

	/** Number of jobs currently waiting in the queue */
	size(): number {
		return this.driver.size();
	}

	/** Remove all pending (not yet started) jobs */
	clear(): void {
		this.driver.clear();
	}
}

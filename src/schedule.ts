import { Cron } from "croner";

export interface SchedulerDriver {
	schedule(
		pattern: string,
		handler: () => void | Promise<void>,
		options?: unknown,
	): unknown;
	stopAll(): void;
}

export class MemorySchedulerDriver implements SchedulerDriver {
	private jobs: Cron[] = [];

	schedule(
		pattern: string,
		handler: () => void | Promise<void>,
		options?: unknown,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: Options are passed dynamically
		const job = new Cron(pattern, options as any, async () => {
			try {
				await handler();
			} catch (err) {
				console.error("[Scheduler] Job failed:", err);
			}
		});
		this.jobs.push(job);
		return job;
	}

	stopAll() {
		for (const job of this.jobs) {
			job.stop();
		}
	}
}

// Global default driver for the decorator
export let defaultSchedulerDriver: SchedulerDriver =
	new MemorySchedulerDriver();

export function setDefaultSchedulerDriver(driver: SchedulerDriver) {
	defaultSchedulerDriver = driver;
}

export class Scheduler {
	constructor(private driver: SchedulerDriver = new MemorySchedulerDriver()) {}

	schedule(
		pattern: string,
		handler: () => void | Promise<void>,
		options?: unknown,
	) {
		return this.driver.schedule(pattern, handler, options);
	}

	stopAll() {
		this.driver.stopAll();
	}
}

/**
 * Decorator to schedule a controller/service method as a cron job.
 *
 * Uses `context.addInitializer` so the job is bound to the **class instance**
 * rather than being scheduled at class-definition time. This means:
 *   - `this` inside the method works correctly (can access injected services).
 *   - The job is only scheduled when the class is instantiated (e.g. via
 *     `app.registerController(new MyController())`).
 *
 * @param pattern - Standard cron expression (e.g. `"0 0 * * *"` for daily at midnight)
 *
 * @example
 * ```ts
 * @Controller("/tasks")
 * export class TaskController {
 *   constructor(private readonly cache: Cache) {}
 *
 *   @CronJob("0 0 * * *")
 *   async dailyCleanup() {
 *     // `this` is the TaskController instance — fully works!
 *     await this.cache.deletePattern("tmp:*");
 *   }
 * }
 * ```
 */
export function CronJob(pattern: string, options?: unknown) {
	return (
		// biome-ignore lint/suspicious/noExplicitAny: Required for Decorator inference
		originalMethod: (...args: any[]) => any,
		context: ClassMethodDecoratorContext,
	) => {
		if (context.kind !== "method") {
			throw new Error("@CronJob can only decorate methods");
		}

		// addInitializer runs after the class instance is constructed,
		// giving us `this` bound to the actual instance.
		// biome-ignore lint/suspicious/noExplicitAny: Required for 'this' binding
		context.addInitializer(function (this: any) {
			const instance = this;
			defaultSchedulerDriver.schedule(
				pattern,
				async () => {
					try {
						await originalMethod.call(instance);
					} catch (err) {
						console.error(`[Cron:${String(context.name)}] Job failed:`, err);
					}
				},
				options,
			);
		});
	};
}

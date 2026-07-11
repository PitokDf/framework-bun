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
 * Decorator to easily schedule methods in a Controller or Service.
 * Uses the defaultSchedulerDriver which can be overridden via setDefaultSchedulerDriver().
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

		defaultSchedulerDriver.schedule(
			pattern,
			async () => {
				try {
					await originalMethod();
				} catch (err) {
					console.error(`[Cron:${String(context.name)}] Job failed:`, err);
				}
			},
			options,
		);
	};
}

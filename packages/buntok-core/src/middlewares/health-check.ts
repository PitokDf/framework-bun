import type { Context } from "../context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApp = {
	get: (
		path: string,
		handler: (ctx: Context) => Promise<Response> | Response,
	) => void;
};

export interface HealthCheckOptions {
	/** Health check endpoint path (default: /health) */
	path?: string;
	/** Custom health check function */
	check?: () => Promise<HealthStatus> | HealthStatus;
	/** Include uptime in response (default: true) */
	includeUptime?: boolean;
	/** Include version in response */
	version?: string;
}

export interface HealthStatus {
	status: "healthy" | "unhealthy" | "degraded";
	message?: string;
	checks?: Record<
		string,
		{ status: string; message?: string; duration?: number }
	>;
}

export interface ReadinessCheck {
	name: string;
	timeout?: number;
	check: () => boolean | Promise<boolean>;
}

export interface ReadinessOptions {
	path?: string;
	checks: ReadinessCheck[];
	overallTimeout?: number;
}

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeoutPromise = new Promise<T>((_, reject) => {
		timer = setTimeout(() => reject(new Error("check timeout")), timeout);
		if (typeof timer === "object" && timer && "unref" in timer) {
			(timer as { unref: () => void }).unref();
		}
	});
	return Promise.race([promise, timeoutPromise]).finally(() => {
		if (timer) clearTimeout(timer);
	});
}

export async function runReadinessChecks(
	checks: ReadinessCheck[],
	overallTimeout = 5000,
): Promise<HealthStatus> {
	const started = Date.now();
	const results: NonNullable<HealthStatus["checks"]> = {};
	let healthy = true;

	for (const check of checks) {
		const remaining = overallTimeout - (Date.now() - started);
		if (remaining <= 0) {
			results[check.name] = { status: "timeout" };
			healthy = false;
			continue;
		}

		const checkStarted = performance.now();
		try {
			const passed = await withTimeout(
				Promise.resolve(check.check()),
				Math.min(check.timeout ?? remaining, remaining),
			);
			results[check.name] = {
				status: passed ? "up" : "down",
				duration: Math.round(performance.now() - checkStarted),
			};
			if (!passed) healthy = false;
		} catch {
			results[check.name] = {
				status: Date.now() - started >= overallTimeout ? "timeout" : "down",
				duration: Math.round(performance.now() - checkStarted),
			};
			healthy = false;
		}
	}

	return { status: healthy ? "healthy" : "unhealthy", checks: results };
}

/** Register a process liveness endpoint that never depends on external services. */
export function livenessCheck(app: AnyApp, path = "/health/live"): void {
	app.get(path, (ctx: Context) =>
		ctx.json({ status: "healthy", timestamp: new Date().toISOString() }, 200),
	);
}

/** Register a bounded dependency readiness endpoint. */
export function readinessCheck(app: AnyApp, options: ReadinessOptions): void {
	const path = options.path ?? "/health/ready";
	app.get(path, async (ctx: Context) => {
		const status = await runReadinessChecks(options.checks, options.overallTimeout);
		return ctx.json(
			{ ...status, timestamp: new Date().toISOString() },
			status.status === "healthy" ? 200 : 503,
		);
	});
}

const startTime = Date.now();

/**
 * Register health check endpoint on the app
 */
export function healthCheck(app: AnyApp, options: HealthCheckOptions = {}) {
	const path = options.path || "/health";

	app.get(path, async (ctx: Context) => {
		try {
			// Run custom health check if provided
			let healthStatus: HealthStatus = { status: "healthy" };

			if (options.check) {
				healthStatus = await options.check();
			}

			const response: Record<string, unknown> = {
				...healthStatus,
				timestamp: new Date().toISOString(),
				uptime:
					options.includeUptime !== false
						? Math.floor((Date.now() - startTime) / 1000)
						: undefined,
				version: options.version,
			};

			// Clean up undefined values
			Object.keys(response).forEach((key) => {
				if (response[key] === undefined) {
					delete response[key];
				}
			});

			const statusCode = healthStatus.status === "healthy" ? 200 : 503;
			return ctx.json(response, statusCode);
		} catch (_error) {
			return ctx.json(
				{
					status: "unhealthy",
					error: "Unknown error",
					timestamp: new Date().toISOString(),
				},
				503,
			);
		}
	});
}

/**
 * Create a database health check function
 */
export function createDatabaseCheck(
	checkFn: () => Promise<boolean>,
): () => Promise<HealthStatus> {
	return async () => {
		const start = performance.now();
		try {
			const isHealthy = await checkFn();
			const duration = performance.now() - start;

			return {
				status: isHealthy ? "healthy" : "unhealthy",
				checks: {
					database: {
						status: isHealthy ? "up" : "down",
						duration: Math.round(duration),
					},
				},
			};
		} catch (error) {
			return {
				status: "unhealthy",
				checks: {
					database: {
						status: "down",
						message:
							error instanceof Error ? error.message : "Connection failed",
					},
				},
			};
		}
	};
}

/**
 * Create a combined health check function
 */
export function createHealthCheck(
	checks: Array<{ name: string; check: () => Promise<boolean> }>,
): () => Promise<HealthStatus> {
	return async () => {
		const results: Record<string, { status: string; duration?: number }> = {};
		let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

		for (const { name, check } of checks) {
			const start = performance.now();
			try {
				const isHealthy = await check();
				const duration = performance.now() - start;

				results[name] = {
					status: isHealthy ? "up" : "down",
					duration: Math.round(duration),
				};

				if (!isHealthy) {
					overallStatus = "unhealthy";
				}
			} catch (_error) {
				results[name] = {
					status: "down",
				};
				overallStatus = "unhealthy";
			}
		}

		return {
			status: overallStatus,
			checks: results,
		};
	};
}

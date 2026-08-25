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

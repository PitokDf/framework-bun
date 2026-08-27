/**
 * Audit logging middleware for tracking user actions.
 *
 * @example
 * ```ts
 * import { auditLog } from "buntok";
 *
 * // Log all requests
 * app.use(auditLog());
 *
 * // Log with custom storage
 * app.use(auditLog({
 *   storage: async (entry) => {
 *     await db.auditLog.create({ data: entry });
 *   },
 *   excludePaths: ["/health", "/docs"],
 *   excludeMethods: ["OPTIONS"],
 * }));
 * ```
 */

export interface AuditLogEntry {
	timestamp: string;
	method: string;
	path: string;
	status: number;
	duration: number;
	ip?: string;
	userId?: string | number;
	userAgent?: string;
	body?: any;
	query?: Record<string, any>;
	error?: string;
}

export interface AuditLogOptions {
	/** Custom storage function. If not provided, logs to console. */
	storage?: (entry: AuditLogEntry) => Promise<void> | void;

	/** Paths to exclude from logging */
	excludePaths?: string[];

	/** Methods to exclude from logging */
	excludeMethods?: string[];

	/** Whether to log request body (default: false) */
	logBody?: boolean;

	/** Whether to log query params (default: true) */
	logQuery?: boolean;

	/** Max body size to log in bytes (default: 1024) */
	maxBodySize?: number;
}

function shouldLog(
	path: string,
	method: string,
	options: AuditLogOptions,
): boolean {
	if (options.excludePaths?.some((p) => path.startsWith(p))) return false;
	if (options.excludeMethods?.includes(method)) return false;
	return true;
}

function truncate(str: string, max: number): string {
	if (str.length <= max) return str;
	return `${str.slice(0, max)}...[truncated]`;
}

/**
 * Audit logging middleware.
 * Logs all requests with timing, user info, and optional body/query.
 */
export function auditLog(options: AuditLogOptions = {}) {
	const { logBody = false, logQuery = true, maxBodySize = 1024 } = options;

	return async (ctx: any, next: () => Promise<Response> | Response) => {
		const method = ctx.request.method;
		const path = ctx.request.url;
		const start = performance.now();

		if (!shouldLog(path, method, options)) {
			return next();
		}

		let response: Response | undefined;
		try {
			response = await next();
		} finally {
			const duration = performance.now() - start;
			const status = response?.status ?? 200;

			const entry: AuditLogEntry = {
				timestamp: new Date().toISOString(),
				method,
				path,
				status,
				duration: Math.round(duration * 100) / 100,
				ip: ctx.request.headers?.get("x-forwarded-for") ?? "",
				userId: ctx.user?.id,
				userAgent: ctx.request.headers?.get("user-agent"),
			};

			if (logBody) {
				try {
					const cloned = ctx.request.clone();
					const bodyStr = await cloned.text();
					entry.body = truncate(bodyStr, maxBodySize);
				} catch {
					// body already consumed
				}
			}

			if (logQuery) {
				try {
					const url = new URL(ctx.request.url);
					const query = Object.fromEntries(url.searchParams);
					if (Object.keys(query).length > 0) {
						entry.query = query;
					}
				} catch {
					// invalid URL
				}
			}

			if (status >= 400) {
				entry.error = ctx._error?.message;
			}

			// Custom storage or console
			if (options.storage) {
				await options.storage(entry);
			} else {
				const logFn =
					status >= 500
						? console.error
						: status >= 400
							? console.warn
							: console.log;
				logFn(`[audit] ${method} ${path} ${status} ${entry.duration}ms`);
			}
		}

		return response as Response;
	};
}

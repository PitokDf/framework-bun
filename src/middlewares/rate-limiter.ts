import type { Context, Middleware } from "../app";

export interface RateLimiterOptions {
	/** Maximum requests per window */
	max?: number;
	/** Window duration in milliseconds (default: 60000 = 1 minute) */
	windowMs?: number;
	/** Custom key function (default: IP address) */
	keyGenerator?: (ctx: Context) => string;
	/** Custom message when rate limit exceeded */
	message?: string;
	/** HTTP status code when rate limit exceeded (default: 429) */
	statusCode?: number;
	/** Skip rate limiting for certain requests */
	skip?: (ctx: Context) => boolean;
	/** Headers to include in response */
	headers?: boolean;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const DEFAULT_OPTIONS: Required<
	Omit<RateLimiterOptions, "keyGenerator" | "skip">
> = {
	max: 100,
	windowMs: 60000,
	message: "Too many requests, please try again later",
	statusCode: 429,
	headers: true,
};

/**
 * Simple in-memory rate limiter
 */
export function rateLimiter(options: RateLimiterOptions = {}): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const store = new Map<string, RateLimitEntry>();

	// Cleanup old entries periodically
	const cleanup = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now > entry.resetTime) {
				store.delete(key);
			}
		}
	}, opts.windowMs);

	// Prevent cleanup from keeping process alive
	if (typeof cleanup === "object" && cleanup.unref) {
		cleanup.unref();
	}

	const getKey =
		options.keyGenerator ||
		((ctx: Context) => {
			return (
				ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
				ctx.request.headers.get("x-real-ip") ||
				"unknown"
			);
		});

	return async (ctx, next) => {
		// Skip if custom skip function returns true
		if (options.skip?.(ctx)) {
			return next();
		}

		const key = getKey(ctx);
		const now = Date.now();
		const entry = store.get(key);

		let count = 1;
		let resetTime = now + opts.windowMs;

		if (entry && now < entry.resetTime) {
			count = entry.count + 1;
			resetTime = entry.resetTime;
		}

		store.set(key, { count, resetTime });

		// Set rate limit headers
		if (opts.headers) {
			ctx.status(200); // Ensure we can set headers
			// Note: Headers will be set on the response
		}

		// Check if rate limit exceeded
		if (count > opts.max) {
			const response = new Response(JSON.stringify({ error: opts.message }), {
				status: opts.statusCode,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(Math.ceil((resetTime - now) / 1000)),
					"X-RateLimit-Limit": String(opts.max),
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
				},
			});
			return response;
		}

		const result = await next();

		// Add rate limit headers to successful response
		if (opts.headers && result instanceof Response) {
			result.headers.set("X-RateLimit-Limit", String(opts.max));
			result.headers.set(
				"X-RateLimit-Remaining",
				String(Math.max(0, opts.max - count)),
			);
			result.headers.set(
				"X-RateLimit-Reset",
				String(Math.ceil(resetTime / 1000)),
			);
		}

		return result;
	};
}

/**
 * Sliding window rate limiter (more accurate but uses more memory)
 */
export function slidingWindowRateLimiter(
	options: RateLimiterOptions = {},
): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };
	const store = new Map<string, number[]>();

	const getKey =
		options.keyGenerator ||
		((ctx: Context) => {
			return (
				ctx.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
				ctx.request.headers.get("x-real-ip") ||
				"unknown"
			);
		});

	return async (ctx, next) => {
		if (options.skip?.(ctx)) {
			return next();
		}

		const key = getKey(ctx);
		const now = Date.now();
		const windowStart = now - opts.windowMs;

		// Get existing timestamps
		const timestamps = store.get(key) || [];

		// Filter to only timestamps within window
		const validTimestamps = timestamps.filter((t) => t > windowStart);

		if (validTimestamps.length >= opts.max) {
			const oldestTimestamp = validTimestamps[0];
			const retryAfter = Math.ceil(
				(oldestTimestamp + opts.windowMs - now) / 1000,
			);

			return new Response(JSON.stringify({ error: opts.message }), {
				status: opts.statusCode,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": String(retryAfter),
					"X-RateLimit-Limit": String(opts.max),
					"X-RateLimit-Remaining": "0",
				},
			});
		}

		// Add current timestamp
		validTimestamps.push(now);
		store.set(key, validTimestamps);

		const result = await next();

		if (result instanceof Response) {
			result.headers.set("X-RateLimit-Limit", String(opts.max));
			result.headers.set(
				"X-RateLimit-Remaining",
				String(opts.max - validTimestamps.length),
			);
		}

		return result;
	};
}

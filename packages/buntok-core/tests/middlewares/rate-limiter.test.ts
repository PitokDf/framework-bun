import { describe, it, expect } from "bun:test";
import { rateLimiter, slidingWindowRateLimiter } from "../../src/middlewares/rate-limiter";

function createMockContext(ip = "127.0.0.1"): any {
	return {
		request: new Request("http://localhost/test", {
			headers: { "x-forwarded-for": ip },
		}),
		store: {},
	};
}

describe("rateLimiter", () => {
	it("should allow requests under the limit", async () => {
		const middleware = rateLimiter({ max: 3, windowMs: 60000 });
		const ctx = createMockContext();

		for (let i = 0; i < 3; i++) {
			const result = await middleware(ctx, async () => new Response("ok"));
			expect(result).toBeInstanceOf(Response);
			expect((result as Response).status).toBe(200);
		}
	});

	it("should block requests over the limit", async () => {
		const middleware = rateLimiter({ max: 2, windowMs: 60000 });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		await middleware(ctx, async () => new Response("ok"));
		const blocked = await middleware(ctx, async () => new Response("ok"));

		expect(blocked).toBeInstanceOf(Response);
		expect((blocked as Response).status).toBe(429);
	});

	it("should add rate limit headers", async () => {
		const middleware = rateLimiter({ max: 10, windowMs: 60000 });
		const ctx = createMockContext();

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;

		expect(result.headers.get("X-RateLimit-Limit")).toBe("10");
		expect(result.headers.get("X-RateLimit-Remaining")).toBe("9");
		expect(result.headers.get("X-RateLimit-Reset")).toBeDefined();
	});

	it("should use custom message", async () => {
		const middleware = rateLimiter({
			max: 1,
			windowMs: 60000,
			message: "Rate limit exceeded",
		});
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		const blocked = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;

		const body = await blocked.json();
		expect(body.error).toBe("Rate limit exceeded");
	});

	it("should skip for custom skip function", async () => {
		const middleware = rateLimiter({
			max: 1,
			windowMs: 60000,
			skip: () => true,
		});
		const ctx = createMockContext();

		// All requests should pass (skip returns true)
		for (let i = 0; i < 5; i++) {
			const result = await middleware(ctx, async () => new Response("ok"));
			expect((result as Response).status).toBe(200);
		}
	});

	it("should use custom key generator", async () => {
		const middleware = rateLimiter({
			max: 1,
			windowMs: 60000,
			keyGenerator: () => "fixed-key",
		});

		const ctx1 = createMockContext("1.1.1.1");
		const ctx2 = createMockContext("2.2.2.2");

		await middleware(ctx1, async () => new Response("ok"));
		// Different IP but same custom key → should be blocked
		const blocked = await middleware(ctx2, async () => new Response("ok"));
		expect((blocked as Response).status).toBe(429);
	});
});

describe("slidingWindowRateLimiter", () => {
	it("should allow requests under the limit", async () => {
		const middleware = slidingWindowRateLimiter({ max: 3, windowMs: 60000 });
		const ctx = createMockContext();

		for (let i = 0; i < 3; i++) {
			const result = await middleware(ctx, async () => new Response("ok"));
			expect((result as Response).status).toBe(200);
		}
	});

	it("should block requests over the limit", async () => {
		const middleware = slidingWindowRateLimiter({ max: 2, windowMs: 60000 });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		await middleware(ctx, async () => new Response("ok"));
		const blocked = await middleware(ctx, async () => new Response("ok"));

		expect((blocked as Response).status).toBe(429);
	});

	it("should add rate limit headers", async () => {
		const middleware = slidingWindowRateLimiter({ max: 10, windowMs: 60000 });
		const ctx = createMockContext();

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;

		expect(result.headers.get("X-RateLimit-Limit")).toBe("10");
		expect(result.headers.get("X-RateLimit-Remaining")).toBe("9");
	});
});

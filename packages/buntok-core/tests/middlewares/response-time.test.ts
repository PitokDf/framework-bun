import { describe, it, expect } from "bun:test";
import { responseTime } from "../../src/middlewares/response-time";

function createMockContext(): any {
	return {
		request: new Request("http://localhost/test"),
		store: {},
	};
}

describe("responseTime", () => {
	it("should add x-response-time header to response", async () => {
		const middleware = responseTime();
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).headers.get("x-response-time")).toBeDefined();
	});

	it("should format in ms by default", async () => {
		const middleware = responseTime({ format: "ms" });
		const ctx = createMockContext();

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		expect(result.headers.get("x-response-time")).toMatch(/[\d.]+ms/);
	});

	it("should format in seconds", async () => {
		const middleware = responseTime({ format: "s" });
		const ctx = createMockContext();

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		expect(result.headers.get("x-response-time")).toMatch(/[\d.]+s/);
	});

	it("should use custom header name", async () => {
		const middleware = responseTime({ header: "x-duration" });
		const ctx = createMockContext();

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		expect(result.headers.get("x-duration")).toBeDefined();
		expect(result.headers.get("x-response-time")).toBeNull();
	});

	it("should store in ctx.store when enabled", async () => {
		const middleware = responseTime({ store: true });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.responseTime).toBeDefined();
	});

	it("should use custom store key", async () => {
		const middleware = responseTime({ store: true, storeKey: "duration" });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.duration).toBeDefined();
		expect(ctx.store.responseTime).toBeUndefined();
	});

	it("should not store when store is disabled", async () => {
		const middleware = responseTime({ store: false });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.responseTime).toBeUndefined();
	});
});

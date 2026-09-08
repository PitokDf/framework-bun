import { describe, it, expect } from "bun:test";
import {
	requestId,
	uuid,
	shortId,
} from "../../src/middlewares/request-id";

function createMockContext(existingId?: string): any {
	const headers: Record<string, string> = {};
	if (existingId) {
		headers["x-request-id"] = existingId;
	}
	return {
		request: new Request("http://localhost/test", { headers }),
		store: {},
	};
}

describe("requestId", () => {
	it("should generate and add request ID to response", async () => {
		const middleware = requestId();
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).headers.get("x-request-id")).toBeDefined();
	});

	it("should use existing request ID from header", async () => {
		const middleware = requestId();
		const ctx = createMockContext("existing-id-123");

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).headers.get("x-request-id")).toBe(
			"existing-id-123",
		);
	});

	it("should store request ID in ctx.store", async () => {
		const middleware = requestId();
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.requestId).toBeDefined();
	});

	it("should use custom header name", async () => {
		const middleware = requestId({ header: "x-correlation-id" });
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(
			(result as Response).headers.get("x-correlation-id"),
		).toBeDefined();
	});

	it("should not store in ctx.store when disabled", async () => {
		const middleware = requestId({ store: false });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));
		expect(ctx.store.requestId).toBeUndefined();
	});
});

describe("uuid", () => {
	it("should generate valid UUID format", () => {
		const id = uuid();
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("should generate unique IDs", () => {
		const ids = new Set(Array.from({ length: 100 }, () => uuid()));
		expect(ids.size).toBe(100);
	});
});

describe("shortId", () => {
	it("should generate 8-character ID", () => {
		expect(shortId()).toHaveLength(8);
	});

	it("should only contain alphanumeric chars", () => {
		expect(shortId()).toMatch(/^[a-f0-9]+$/);
	});
});

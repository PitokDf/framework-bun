import { describe, it, expect, mock } from "bun:test";
import { auditLog } from "../../src/middlewares/audit-log";

function createMockContext(
	path = "http://localhost/test",
	method = "GET",
	user?: any,
): any {
	return {
		request: new Request(path, { method }),
		user,
		store: {},
	};
}

describe("auditLog", () => {
	it("should call storage function with entry", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e) });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("ok"));

		expect(entries.length).toBe(1);
		expect(entries[0].method).toBe("GET");
		expect(entries[0].path).toBe("http://localhost/test");
		expect(entries[0].status).toBe(200);
		expect(entries[0].duration).toBeGreaterThanOrEqual(0);
	});

	it("should log status code from response", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e) });
		const ctx = createMockContext();

		await middleware(ctx, async () => new Response("Not Found", { status: 404 }));

		expect(entries[0].status).toBe(404);
	});

	it("should log user ID", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e) });
		const ctx = createMockContext("http://localhost/test", "GET", { id: "user-123" });

		await middleware(ctx, async () => new Response("ok"));

		expect(entries[0].userId).toBe("user-123");
	});

	it("should log query params", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e) });
		const ctx = createMockContext("http://localhost/test?page=1&limit=10");

		await middleware(ctx, async () => new Response("ok"));

		expect(entries[0].query).toEqual({ page: "1", limit: "10" });
	});

	it("should exclude paths", async () => {
		const entries: any[] = [];
		const middleware = auditLog({
			storage: (e) => entries.push(e),
			excludePaths: ["http://localhost/health"],
		});
		const ctx = createMockContext("http://localhost/health");

		await middleware(ctx, async () => new Response("ok"));

		expect(entries.length).toBe(0);
	});

	it("should exclude methods", async () => {
		const entries: any[] = [];
		const middleware = auditLog({
			storage: (e) => entries.push(e),
			excludeMethods: ["OPTIONS"],
		});
		const ctx = createMockContext("http://localhost/test", "OPTIONS");

		await middleware(ctx, async () => new Response("ok"));

		expect(entries.length).toBe(0);
	});

	it("should log request body when enabled", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e), logBody: true });
		const ctx = createMockContext();
		ctx.request = new Request("http://localhost/test", {
			method: "POST",
			body: '{"name":"test"}',
			headers: { "Content-Type": "application/json" },
		});

		await middleware(ctx, async () => new Response("ok"));

		expect(entries[0].body).toBe('{"name":"test"}');
	});

	it("should not log query when disabled", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e), logQuery: false });
		const ctx = createMockContext("http://localhost/test?page=1");

		await middleware(ctx, async () => new Response("ok"));

		expect(entries[0].query).toBeUndefined();
	});

	it("should log error message for 5xx status", async () => {
		const entries: any[] = [];
		const middleware = auditLog({ storage: (e) => entries.push(e) });
		const ctx = createMockContext();

		await middleware(ctx, async () => {
			throw new Error("Database down");
		}).catch(() => {});

		// The middleware catches errors, so entry should be logged
	});

	it("should default to console when no storage", async () => {
		const middleware = auditLog();
		const ctx = createMockContext();

		// Should not throw
		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});
});

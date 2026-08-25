import { describe, it, expect, beforeEach } from "bun:test";
import { Context } from "../src/context";

function createRequest(path = "/test", options?: RequestInit): Request {
	return new Request(`http://localhost${path}`, options);
}

describe("Context", () => {
	let ctx: Context;

	beforeEach(() => {
		const req = createRequest("/test?id=1&name=test");
		ctx = new Context(req, { id: "1" });
	});

	describe("constructor", () => {
		it("should set request and params", () => {
			expect(ctx.request).toBeDefined();
			expect(ctx.params).toEqual({ id: "1" });
		});
	});

	describe("query", () => {
		it("should parse query string", () => {
			expect(ctx.query).toEqual({ id: "1", name: "test" });
		});

		it("should cache parsed query", () => {
			const q1 = ctx.query;
			const q2 = ctx.query;
			expect(q1).toBe(q2); // Same reference
		});
	});

	describe("ip", () => {
		it("should return 127.0.0.1 by default", () => {
			expect(ctx.ip).toBe("127.0.0.1");
		});

		it("should return x-forwarded-for header value", () => {
			const req = createRequest("/test", {
				headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
			});
			const context = new Context(req, {});
			expect(context.ip).toBe("192.168.1.1");
		});
	});

	describe("body", () => {
		it("should parse JSON body", async () => {
			const req = createRequest("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "John" }),
			});
			const context = new Context(req, {});
			const body = await context.body<{ name: string }>();
			expect(body).toEqual({ name: "John" });
		});

		it("should cache parsed body", async () => {
			const req = createRequest("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "John" }),
			});
			const context = new Context(req, {});
			const body1 = await context.body();
			const body2 = await context.body();
			expect(body1).toBe(body2);
		});
	});

	describe("response helpers", () => {
		it("json() should return JSON response", () => {
			const res = ctx.json({ ok: true });
			expect(res.headers.get("content-type")).toContain("application/json");
		});

		it("json() should use custom status code", () => {
			const res = ctx.json({ ok: true }, 201);
			expect(res.status).toBe(201);
		});

		it("success() should return success response", async () => {
			const res = ctx.success({ id: 1 }, "Created", 201);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.message).toBe("Created");
			expect(body.data).toEqual({ id: 1 });
			expect(res.status).toBe(201);
		});

		it("paginate() should return paginated response", async () => {
			const res = ctx.paginate([1, 2, 3], 10, 1, 3);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual([1, 2, 3]);
			expect(body.meta).toEqual({
				currentPage: 1,
				perPage: 3,
				total: 10,
				lastPage: 4,
				hasMore: true,
			});
		});

		it("cursorPaginate() should return cursor response", async () => {
			const res = ctx.cursorPaginate([1, 2, 3], "cursor123");
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.data).toEqual([1, 2, 3]);
			expect(body.meta).toEqual({
				nextCursor: "cursor123",
				hasMore: true,
			});
		});

		it("cursorPaginate() should handle null cursor", async () => {
			const res = ctx.cursorPaginate([], null);
			const body = await res.json();
			expect(body.meta.hasMore).toBe(false);
		});

		it("error() should return error response", async () => {
			const res = ctx.error("Bad request", 400, { field: "email" });
			const body = await res.json();
			expect(body.success).toBe(false);
			expect(body.message).toBe("Bad request");
			expect(body.details).toEqual({ field: "email" });
			expect(res.status).toBe(400);
		});

		it("text() should return text response", async () => {
			const res = ctx.text("hello");
			const text = await res.text();
			expect(text).toBe("hello");
		});

		it("html() should return HTML response", async () => {
			const res = ctx.html("<h1>Hello</h1>");
			expect(res.headers.get("content-type")).toBe("text/html");
		});

		it("redirect() should return redirect response", () => {
			const res = ctx.redirect("/login", 302);
			expect(res.status).toBe(302);
			expect(res.headers.get("location")).toBe("/login");
		});

		it("status() should return empty response with status", () => {
			const res = ctx.status(204);
			expect(res.status).toBe(204);
		});
	});

	describe("store", () => {
		it("should initialize empty store", () => {
			expect(ctx.store).toEqual({});
		});

		it("should set and get store values", () => {
			ctx.store = { user: { id: 1 } };
			expect(ctx.store.user).toEqual({ id: 1 });
		});
	});

	describe("valid", () => {
		it("should throw if no validator ran", () => {
			expect(() => ctx.valid("body")).toThrow("zValidator");
		});

		it("should return validated data", () => {
			ctx.setValidated("body", { name: "test" });
			expect(ctx.valid<{ name: string }>("body")).toEqual({ name: "test" });
		});
	});
});

import { describe, expect, it, mock } from "bun:test";
import { requireRole, requirePermission } from "../src/middlewares/rbac";

function mockJson(ctx: any) {
	const fn = mock((data: any, status?: number) => {
		const s = status ?? ctx.status ?? 200;
		return new Response(JSON.stringify(data), { status: s });
	});
	ctx.json = fn;
	return fn;
}

describe("requireRole", () => {
	function createCtx(user?: any) {
		const ctx: any = { user, status: 200, req: { headers: {} } };
		mockJson(ctx);
		return ctx;
	}

	it("should return 401 if no user", async () => {
		const ctx = createCtx();
		const next = mock(() => Promise.resolve());

		const middleware = requireRole("admin");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 403 if user lacks role", async () => {
		const ctx = createCtx({ role: "user" });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole("admin");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next if user has role", async () => {
		const ctx = createCtx({ role: "admin" });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole("admin");
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should accept multiple roles (any match)", async () => {
		const ctx = createCtx({ role: "moderator" });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole("admin", "moderator");
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should extract roles from user.roles array", async () => {
		const ctx = createCtx({ roles: ["editor", "viewer"] });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole("editor");
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should support custom resolver", async () => {
		const ctx = createCtx({ permissions: ["admin", "user"] });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole({
			roles: ["admin"],
			resolver: (user) => user.permissions,
		});
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should support custom error message", async () => {
		const ctx = createCtx({ role: "user" });
		const next = mock(() => Promise.resolve());

		const middleware = requireRole({
			roles: ["admin"],
			message: "Custom error",
		});
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(403);
		const body = await res!.json();
		expect(body.message).toBe("Custom error");
	});
});

describe("requirePermission", () => {
	function createCtx(user?: any) {
		const ctx: any = { user, status: 200, req: { headers: {} } };
		mockJson(ctx);
		return ctx;
	}

	it("should return 401 if no user", async () => {
		const ctx = createCtx();
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission("users:delete");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(401);
		expect(next).not.toHaveBeenCalled();
	});

	it("should return 403 if user lacks permission", async () => {
		const ctx = createCtx({ permissions: ["users:read"] });
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission("users:delete");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("should call next if user has permission", async () => {
		const ctx = createCtx({ permissions: ["users:delete"] });
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission("users:delete");
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should require ALL permissions", async () => {
		const ctx = createCtx({ permissions: ["users:read", "users:delete"] });
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission("users:read", "users:write");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(403);
		expect(next).not.toHaveBeenCalled();
	});

	it("should support custom resolver", async () => {
		const ctx = createCtx({ scope: ["posts:edit", "posts:delete"] });
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission({
			permissions: ["posts:edit"],
			resolver: (user) => user.scope,
		});
		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it("should list missing permissions in error", async () => {
		const ctx = createCtx({ permissions: [] });
		const next = mock(() => Promise.resolve());

		const middleware = requirePermission("a", "b");
		const res = await middleware(ctx, next);

		expect(res).toBeInstanceOf(Response);
		expect(res!.status).toBe(403);
		const body = await res!.json();
		expect(body.message).toContain("a");
		expect(body.message).toContain("b");
	});
});

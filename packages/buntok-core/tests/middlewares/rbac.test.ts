import { describe, it, expect } from "bun:test";
import { requireRole, requirePermission } from "../../src/middlewares/rbac";

function createMockContext(user?: any): any {
	return {
		user,
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("requireRole", () => {
	it("should return 401 if no user", async () => {
		const middleware = requireRole("admin");
		const ctx = createMockContext(undefined);

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(401);
	});

	it("should return 403 if user lacks role", async () => {
		const middleware = requireRole("admin");
		const ctx = createMockContext({ role: "user" });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(403);
	});

	it("should pass if user has role", async () => {
		const middleware = requireRole("admin");
		const ctx = createMockContext({ role: "admin" });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});

	it("should accept any of multiple roles", async () => {
		const middleware = requireRole("admin", "moderator");
		const ctx = createMockContext({ role: "moderator" });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});

	it("should check roles array", async () => {
		const middleware = requireRole("admin");
		const ctx = createMockContext({ roles: ["admin", "user"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});

	it("should support options object", async () => {
		const middleware = requireRole({
			roles: ["admin"],
			message: "Admins only",
		});
		const ctx = createMockContext({ role: "user" });

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		expect(result.status).toBe(403);
		const body = await result.json();
		expect(body.message).toBe("Admins only");
	});

	it("should support custom resolver", async () => {
		const middleware = requireRole({
			roles: ["superadmin"],
			resolver: (user: any) => user.customRoles,
		});
		const ctx = createMockContext({ customRoles: ["superadmin"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});
});

describe("requirePermission", () => {
	it("should return 401 if no user", async () => {
		const middleware = requirePermission("users:delete");
		const ctx = createMockContext(undefined);

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(401);
	});

	it("should return 403 if user lacks permission", async () => {
		const middleware = requirePermission("users:delete");
		const ctx = createMockContext({ permissions: ["users:read"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(403);
	});

	it("should pass if user has permission", async () => {
		const middleware = requirePermission("users:delete");
		const ctx = createMockContext({ permissions: ["users:delete"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});

	it("should require ALL permissions", async () => {
		const middleware = requirePermission("users:read", "users:delete");
		const ctx = createMockContext({ permissions: ["users:read"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(403);
	});

	it("should pass if user has all permissions", async () => {
		const middleware = requirePermission("users:read", "users:delete");
		const ctx = createMockContext({
			permissions: ["users:read", "users:delete"],
		});

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});

	it("should support options object with custom message", async () => {
		const middleware = requirePermission({
			permissions: ["users:delete"],
			message: "No permission",
		});
		const ctx = createMockContext({ permissions: [] });

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		expect(result.status).toBe(403);
		const body = await result.json();
		expect(body.message).toBe("No permission");
	});

	it("should report missing permissions", async () => {
		const middleware = requirePermission("users:read", "users:delete");
		const ctx = createMockContext({ permissions: [] });

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		const body = await result.json();
		expect(body.message).toContain("users:read");
		expect(body.message).toContain("users:delete");
	});

	it("should support custom resolver", async () => {
		const middleware = requirePermission({
			permissions: ["special"],
			resolver: (user: any) => user.perms,
		});
		const ctx = createMockContext({ perms: ["special"] });

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});
});

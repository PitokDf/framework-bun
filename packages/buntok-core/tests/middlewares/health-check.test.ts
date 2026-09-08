import { describe, it, expect } from "bun:test";
import {
	healthCheck,
	createDatabaseCheck,
	createHealthCheck,
} from "../../src/middlewares/health-check";

function createMockApp(): any {
	let handler: any;
	return {
		get: (_path: string, h: any) => {
			handler = h;
		},
		getHandler: () => handler,
	};
}

function createMockContext(): any {
	return {
		request: new Request("http://localhost/health"),
		store: {},
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("healthCheck", () => {
	it("should register GET /health endpoint", () => {
		const app = createMockApp();
		healthCheck(app);
		expect(app.getHandler()).toBeDefined();
	});

	it("should use custom path", () => {
		const app = createMockApp();
		healthCheck(app, { path: "/ready" });
		expect(app.getHandler()).toBeDefined();
	});

	it("should return healthy status", async () => {
		const app = createMockApp();
		healthCheck(app);
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body.status).toBe("healthy");
		expect(body.timestamp).toBeDefined();
	});

	it("should include uptime", async () => {
		const app = createMockApp();
		healthCheck(app);
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		const body = await response.json();
		expect(body.uptime).toBeDefined();
		expect(body.uptime).toBeGreaterThanOrEqual(0);
	});

	it("should include version", async () => {
		const app = createMockApp();
		healthCheck(app, { version: "1.0.0" });
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		const body = await response.json();
		expect(body.version).toBe("1.0.0");
	});

	it("should use custom check function", async () => {
		const app = createMockApp();
		healthCheck(app, {
			check: () => ({ status: "degraded", message: "Slow response" }),
		});
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		expect(response.status).toBe(503);

		const body = await response.json();
		expect(body.status).toBe("degraded");
	});

	it("should handle check function errors", async () => {
		const app = createMockApp();
		healthCheck(app, {
			check: () => {
				throw new Error("DB down");
			},
		});
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		expect(response.status).toBe(503);
	});

	it("should not include uptime when disabled", async () => {
		const app = createMockApp();
		healthCheck(app, { includeUptime: false });
		const handler = app.getHandler();
		const ctx = createMockContext();

		const response = await handler(ctx);
		const body = await response.json();
		expect(body.uptime).toBeUndefined();
	});
});

describe("createDatabaseCheck", () => {
	it("should return healthy when check passes", async () => {
		const check = createDatabaseCheck(async () => true);
		const result = await check();
		expect(result.status).toBe("healthy");
		expect(result.checks?.database?.status).toBe("up");
	});

	it("should return unhealthy when check fails", async () => {
		const check = createDatabaseCheck(async () => false);
		const result = await check();
		expect(result.status).toBe("unhealthy");
		expect(result.checks?.database?.status).toBe("down");
	});

	it("should handle errors", async () => {
		const check = createDatabaseCheck(async () => {
			throw new Error("Connection refused");
		});
		const result = await check();
		expect(result.status).toBe("unhealthy");
		expect(result.checks?.database?.message).toBe("Connection refused");
	});
});

describe("createHealthCheck", () => {
	it("should run all checks", async () => {
		const check = createHealthCheck([
			{ name: "db", check: async () => true },
			{ name: "redis", check: async () => true },
		]);
		const result = await check();
		expect(result.status).toBe("healthy");
		expect(result.checks?.db?.status).toBe("up");
		expect(result.checks?.redis?.status).toBe("up");
	});

	it("should return unhealthy if any check fails", async () => {
		const check = createHealthCheck([
			{ name: "db", check: async () => true },
			{ name: "redis", check: async () => false },
		]);
		const result = await check();
		expect(result.status).toBe("unhealthy");
	});

	it("should handle check errors", async () => {
		const check = createHealthCheck([
			{
				name: "db",
				check: async () => {
					throw new Error("timeout");
				},
			},
		]);
		const result = await check();
		expect(result.status).toBe("unhealthy");
		expect(result.checks?.db?.status).toBe("down");
	});
});

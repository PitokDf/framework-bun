import { describe, it, expect } from "bun:test";
import { helmet } from "../../src/middlewares/helmet";

function createMockContext(
	headers: Record<string, string> = {},
): any {
	return {
		request: new Request("http://localhost/test", { headers }),
		store: {},
	};
}

describe("helmet", () => {
	it("should add default security headers", async () => {
		const middleware = helmet();
		const ctx = createMockContext();
		const response = new Response("ok");

		const result = await middleware(ctx, async () => response);

		expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(result.headers.get("X-Frame-Options")).toBe("DENY");
		expect(result.headers.get("X-XSS-Protection")).toBe("0");
		expect(result.headers.get("Referrer-Policy")).toBe("no-referrer");
		expect(result.headers.get("Strict-Transport-Security")).toContain(
			"max-age=31536000",
		);
		expect(result.headers.get("X-DNS-Prefetch-Control")).toBe("on");
		expect(result.headers.get("Permissions-Policy")).toContain("camera=()");
	});

	it("should allow custom frame options", async () => {
		const middleware = helmet({ frameOptions: "SAMEORIGIN" });
		const ctx = createMockContext();
		const response = new Response("ok");

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
	});

	it("should not overwrite existing headers", async () => {
		const middleware = helmet();
		const ctx = createMockContext();
		const response = new Response("ok", {
			headers: { "X-Frame-Options": "ALLOW" },
		});

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("X-Frame-Options")).toBe("ALLOW");
	});

	it("should add additional headers", async () => {
		const middleware = helmet({
			additionalHeaders: { "X-Custom": "test" },
		});
		const ctx = createMockContext();
		const response = new Response("ok");

		const result = await middleware(ctx, async () => response);
		expect(result.headers.get("X-Custom")).toBe("test");
	});
});

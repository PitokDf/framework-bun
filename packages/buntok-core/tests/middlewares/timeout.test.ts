import { describe, it, expect } from "bun:test";
import { timeout, TimeoutError } from "../../src/middlewares/timeout";

function createMockContext(): any {
	return {
		request: new Request("http://localhost/test"),
		store: {},
	};
}

describe("timeout", () => {
	it("should pass through fast handlers", async () => {
		const middleware = timeout(1000);
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(200);
	});

	it("should throw TimeoutError for slow handlers", async () => {
		const middleware = timeout(50);
		const ctx = createMockContext();

		try {
			await middleware(ctx, async () => {
				await new Promise((r) => setTimeout(r, 200));
				return new Response("ok");
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(TimeoutError);
			expect((e as TimeoutError).timeoutMs).toBe(50);
		}
	});

	it("should use custom message", async () => {
		const middleware = timeout(50, "Custom timeout message");
		const ctx = createMockContext();

		try {
			await middleware(ctx, async () => {
				await new Promise((r) => setTimeout(r, 200));
				return new Response("ok");
			});
			expect(true).toBe(false);
		} catch (e) {
			expect((e as Error).message).toBe("Custom timeout message");
		}
	});

	it("should skip timeout for SSE requests", async () => {
		const middleware = timeout(1); // very short timeout
		const ctx = {
			request: new Request("http://localhost/test", {
				headers: { accept: "text/event-stream" },
			}),
			store: {},
		};

		const result = await middleware(ctx, async () => {
			await new Promise((r) => setTimeout(r, 50));
			return new Response("ok");
		});
		expect((result as Response).status).toBe(200);
	});
});

describe("TimeoutError", () => {
	it("should have correct name and timeoutMs", () => {
		const error = new TimeoutError("timed out", 5000);
		expect(error.name).toBe("TimeoutError");
		expect(error.message).toBe("timed out");
		expect(error.timeoutMs).toBe(5000);
	});
});

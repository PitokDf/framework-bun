import { describe, it, expect } from "bun:test";
import { bodySizeLimit } from "../../src/middlewares/body-size-limit";

function createMockContext(contentLength?: string): any {
	const headers: Record<string, string> = {};
	if (contentLength !== undefined) {
		headers["content-length"] = contentLength;
	}
	return {
		request: new Request("http://localhost/test", { method: "POST", headers }),
		store: {},
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("bodySizeLimit", () => {
	it("should allow requests under the limit", async () => {
		const middleware = bodySizeLimit({ maxSize: 1024 });
		const ctx = createMockContext("512");

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(200);
	});

	it("should reject requests over the limit", async () => {
		const middleware = bodySizeLimit({ maxSize: 1024 });
		const ctx = createMockContext("2048");

		const result = await middleware(ctx, async () => new Response("ok"));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(413);
	});

	it("should use custom status code", async () => {
		const middleware = bodySizeLimit({ maxSize: 1024, statusCode: 400 });
		const ctx = createMockContext("2048");

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(400);
	});

	it("should use custom message", async () => {
		const middleware = bodySizeLimit({
			maxSize: 1024,
			message: "File too large",
		});
		const ctx = createMockContext("2048");

		const result = (await middleware(ctx, async () =>
			new Response("ok"),
		)) as Response;
		const body = await result.json();
		expect(body.message).toBe("File too large");
	});

	it("should allow requests without content-length", async () => {
		const middleware = bodySizeLimit({ maxSize: 1024 });
		const ctx = createMockContext();

		const result = await middleware(ctx, async () => new Response("ok"));
		expect((result as Response).status).toBe(200);
	});
});

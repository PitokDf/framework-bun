import { describe, it, expect } from "bun:test";
import { downloadBuffer } from "../../src/helpers/download";

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("downloadBuffer", () => {
	it("should return attachment response", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Disposition")).toContain("file.bin");
		expect(result.headers.get("Content-Disposition")).toContain("attachment");
	});

	it("should detect content type from extension", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "image.png");
		expect(result.headers.get("Content-Type")).toBe("image/png");
	});

	it("should use custom content type", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1, 2, 3]);

		const result = downloadBuffer(ctx, data, "file.bin", {
			contentType: "application/custom",
		});
		expect(result.headers.get("Content-Type")).toBe("application/custom");
	});

	it("should handle ArrayBuffer", () => {
		const ctx = createMockContext();
		const data = new ArrayBuffer(3);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result).toBeInstanceOf(Response);
	});

	it("should handle Blob", () => {
		const ctx = createMockContext();
		const data = new Blob(["content"]);

		const result = downloadBuffer(ctx, data, "file.txt");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Type")).toBe("text/plain");
	});

	it("should use custom cache control", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1]);

		const result = downloadBuffer(ctx, data, "file.bin", {
			cacheControl: "max-age=3600",
		});
		expect(result.headers.get("Cache-Control")).toBe("max-age=3600");
	});

	it("should default to no-cache", () => {
		const ctx = createMockContext();
		const data = new Uint8Array([1]);

		const result = downloadBuffer(ctx, data, "file.bin");
		expect(result.headers.get("Cache-Control")).toBe("no-cache");
	});
});

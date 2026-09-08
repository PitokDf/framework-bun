import { describe, it, expect } from "bun:test";
import { createZIP } from "../../src/helpers/archive";

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

describe("createZIP", () => {
	it("should create a tar archive response", async () => {
		const ctx = createMockContext();
		const files = [
			{ name: "file1.txt", data: "hello" },
			{ name: "file2.txt", data: "world" },
		];

		const result = await createZIP(ctx, files, "test.tar");
		expect(result).toBeInstanceOf(Response);
		expect(result.headers.get("Content-Type")).toBe("application/octet-stream");
		expect(result.headers.get("Content-Disposition")).toContain("test.tar");
	});

	it("should use default filename", async () => {
		const ctx = createMockContext();
		const files = [{ name: "a.txt", data: "data" }];

		const result = await createZIP(ctx, files);
		expect(result.headers.get("Content-Disposition")).toContain("export.tar");
	});

	it("should create compressed archive when compress option is true", async () => {
		const ctx = createMockContext();
		const files = [{ name: "a.txt", data: "data" }];

		const result = await createZIP(ctx, files, "test.tar.gz", {
			compress: true,
		});
		expect(result.headers.get("Content-Disposition")).toContain("test.tar.gz");
	});

	it("should handle Uint8Array data", async () => {
		const ctx = createMockContext();
		const files = [{ name: "binary.bin", data: new Uint8Array([1, 2, 3]) }];

		const result = await createZIP(ctx, files);
		expect(result).toBeInstanceOf(Response);
	});

	it("should handle Blob data", async () => {
		const ctx = createMockContext();
		const files = [{ name: "blob.bin", data: new Blob(["content"]) }];

		const result = await createZIP(ctx, files);
		expect(result).toBeInstanceOf(Response);
	});
});

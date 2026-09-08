import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { serveFileOrFallback } from "../../src/helpers/file";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

const TEST_DIR = "/tmp/buntok-file-test";
const TEST_FILE = `${TEST_DIR}/test.txt`;

function createMockContext(): any {
	return {
		json: (data: any, status = 200) =>
			new Response(JSON.stringify(data), { status }),
	};
}

beforeEach(() => {
	if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
	writeFileSync(TEST_FILE, "hello world");
});

afterEach(() => {
	if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
	if (existsSync(TEST_DIR)) {
		try {
			require("node:fs").rmdirSync(TEST_DIR);
		} catch {}
	}
});

describe("serveFileOrFallback", () => {
	it("should serve file if it exists", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(ctx, TEST_FILE, () =>
			new Response("fallback"),
		);
		expect(result).toBeInstanceOf(Response);
		expect(await result.text()).toBe("hello world");
	});

	it("should return fallback if file does not exist", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			"/nonexistent/file.txt",
			() => new Response("fallback"),
		);
		expect(await result.text()).toBe("fallback");
	});

	it("should return static fallback response", async () => {
		const ctx = createMockContext();
		const fallback = new Response("static fallback");
		const result = await serveFileOrFallback(
			ctx,
			"/nonexistent/file.txt",
			fallback,
		);
		expect(result).toBe(fallback);
	});

	it("should detect content type from extension", async () => {
		const pngFile = `${TEST_DIR}/test.png`;
		writeFileSync(pngFile, "png data");
		try {
			const ctx = createMockContext();
			const result = await serveFileOrFallback(ctx, pngFile, () =>
				new Response("fallback"),
			);
			expect(result.headers.get("Content-Type")).toBe("image/png");
		} finally {
			unlinkSync(pngFile);
		}
	});

	it("should use custom content type", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			TEST_FILE,
			() => new Response("fallback"),
			{ contentType: "text/custom" },
		);
		expect(result.headers.get("Content-Type")).toBe("text/custom");
	});

	it("should use custom cache control", async () => {
		const ctx = createMockContext();
		const result = await serveFileOrFallback(
			ctx,
			TEST_FILE,
			() => new Response("fallback"),
			{ cacheControl: "no-store" },
		);
		expect(result.headers.get("Cache-Control")).toBe("no-store");
	});
});

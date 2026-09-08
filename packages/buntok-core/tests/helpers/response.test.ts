import { describe, it, expect } from "bun:test";
import { toResponse, toResponseMaybeAsync } from "../../src/helpers/response";

describe("toResponse", () => {
	it("should passthrough Response", () => {
		const res = new Response("hello");
		expect(toResponse(res)).toBe(res);
	});

	it("should return 204 for null", () => {
		const res = toResponse(null);
		expect(res.status).toBe(204);
	});

	it("should return 204 for undefined", () => {
		const res = toResponse(undefined);
		expect(res.status).toBe(204);
	});

	it("should convert string to text/plain", () => {
		const res = toResponse("hello");
		expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
	});

	it("should convert number to text/plain", () => {
		const res = toResponse(42);
		expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
	});

	it("should convert boolean to text/plain", () => {
		const res = toResponse(true);
		expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
	});

	it("should convert object to JSON", async () => {
		const res = toResponse({ ok: true });
		expect(res.headers.get("Content-Type")).toContain("application/json");
		const body = await res.json();
		expect(body.ok).toBe(true);
	});

	it("should convert array to JSON", async () => {
		const res = toResponse([1, 2, 3]);
		const body = await res.json();
		expect(body).toEqual([1, 2, 3]);
	});

	it("should passthrough Blob", () => {
		const blob = new Blob(["hello"]);
		const res = toResponse(blob);
		expect(res).toBeInstanceOf(Response);
	});

	it("should passthrough Uint8Array", () => {
		const data = new Uint8Array([1, 2, 3]);
		const res = toResponse(data);
		expect(res).toBeInstanceOf(Response);
	});
});

describe("toResponseMaybeAsync", () => {
	it("should handle sync values", () => {
		const res = toResponseMaybeAsync("hello");
		expect(res).toBeInstanceOf(Response);
	});

	it("should handle Promise values", async () => {
		const res = await toResponseMaybeAsync(Promise.resolve("hello"));
		expect(res).toBeInstanceOf(Response);
	});

	it("should handle Promise<Response>", async () => {
		const original = new Response("ok");
		const res = await toResponseMaybeAsync(Promise.resolve(original));
		expect(res).toBe(original);
	});
});

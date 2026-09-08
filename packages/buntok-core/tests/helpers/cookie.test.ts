import { describe, it, expect } from "bun:test";
import {
	parseCookies,
	serializeCookie,
	setCookie,
	deleteCookie,
} from "../../src/helpers/cookie";

describe("parseCookies", () => {
	it("should parse single cookie", () => {
		expect(parseCookies("name=value")).toEqual({ name: "value" });
	});

	it("should parse multiple cookies", () => {
		expect(parseCookies("a=1; b=2; c=3")).toEqual({ a: "1", b: "2", c: "3" });
	});

	it("should handle empty string", () => {
		expect(parseCookies("")).toEqual({});
	});

	it("should handle URL-encoded values", () => {
		expect(parseCookies("name=hello%20world")).toEqual({
			name: "hello world",
		});
	});

	it("should handle values with equals signs", () => {
		expect(parseCookies("token=abc=def")).toEqual({ token: "abc=def" });
	});
});

describe("serializeCookie", () => {
	it("should serialize basic cookie", () => {
		const result = serializeCookie("name", "value");
		expect(result).toBe("name=value; Path=/");
	});

	it("should include Max-Age", () => {
		const result = serializeCookie("name", "value", { maxAge: 3600 });
		expect(result).toContain("Max-Age=3600");
	});

	it("should include Secure flag", () => {
		const result = serializeCookie("name", "value", { secure: true });
		expect(result).toContain("; Secure");
	});

	it("should include HttpOnly flag", () => {
		const result = serializeCookie("name", "value", { httpOnly: true });
		expect(result).toContain("; HttpOnly");
	});

	it("should include SameSite", () => {
		const result = serializeCookie("name", "value", { sameSite: "strict" });
		expect(result).toContain("SameSite=Strict");
	});

	it("should include Domain", () => {
		const result = serializeCookie("name", "value", { domain: "example.com" });
		expect(result).toContain("Domain=example.com");
	});

	it("should include custom Path", () => {
		const result = serializeCookie("name", "value", { path: "/api" });
		expect(result).toContain("Path=/api");
	});

	it("should include Partitioned flag", () => {
		const result = serializeCookie("name", "value", { partitioned: true });
		expect(result).toContain("; Partitioned");
	});
});

describe("setCookie", () => {
	it("should add Set-Cookie header to response", () => {
		const original = new Response("ok");
		const result = setCookie(original, "session", "abc123");
		expect(result.headers.get("Set-Cookie")).toContain("session=abc123");
	});

	it("should preserve existing headers", () => {
		const original = new Response("ok", {
			headers: { "X-Custom": "test" },
		});
		const result = setCookie(original, "session", "abc123");
		expect(result.headers.get("X-Custom")).toBe("test");
	});
});

describe("deleteCookie", () => {
	it("should set cookie with maxAge=0", () => {
		const original = new Response("ok");
		const result = deleteCookie(original, "session");
		const cookie = result.headers.get("Set-Cookie");
		expect(cookie).toContain("session=");
		expect(cookie).toContain("Max-Age=0");
	});
});

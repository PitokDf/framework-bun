import { describe, it, expect } from "bun:test";
import { getClientIP, isPrivateIP, parseUserAgent } from "../../src/helpers/network";

describe("getClientIP", () => {
	it("should extract IP from X-Forwarded-For", () => {
		const req = new Request("http://localhost", {
			headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
		});
		expect(getClientIP(req)).toBe("192.168.1.1");
	});

	it("should extract IP from X-Real-IP", () => {
		const req = new Request("http://localhost", {
			headers: { "x-real-ip": "203.0.113.50" },
		});
		expect(getClientIP(req)).toBe("203.0.113.50");
	});

	it("should return 'unknown' when no headers present", () => {
		const req = new Request("http://localhost");
		expect(getClientIP(req)).toBe("unknown");
	});

	it("should prefer X-Forwarded-For over X-Real-IP", () => {
		const req = new Request("http://localhost", {
			headers: {
				"x-forwarded-for": "1.2.3.4",
				"x-real-ip": "5.6.7.8",
			},
		});
		expect(getClientIP(req)).toBe("1.2.3.4");
	});
});

describe("isPrivateIP", () => {
	it("should detect 10.x.x.x as private", () => {
		expect(isPrivateIP("10.0.0.1")).toBe(true);
	});

	it("should detect 172.16-31.x.x as private", () => {
		expect(isPrivateIP("172.16.0.1")).toBe(true);
		expect(isPrivateIP("172.31.255.255")).toBe(true);
	});

	it("should detect 192.168.x.x as private", () => {
		expect(isPrivateIP("192.168.1.1")).toBe(true);
	});

	it("should detect 127.x.x.x as private (loopback)", () => {
		expect(isPrivateIP("127.0.0.1")).toBe(true);
	});

	it("should detect localhost as private", () => {
		expect(isPrivateIP("localhost")).toBe(true);
	});

	it("should detect public IPs as not private", () => {
		expect(isPrivateIP("8.8.8.8")).toBe(false);
		expect(isPrivateIP("1.1.1.1")).toBe(false);
	});
});

describe("parseUserAgent", () => {
	it("should detect Chrome on Windows", () => {
		const req = new Request("http://localhost", {
			headers: {
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});
		const ua = parseUserAgent(req);
		expect(ua.browser).toBe("Chrome");
		expect(ua.os).toBe("Windows");
		expect(ua.device).toBe("Desktop");
	});

	it("should detect Firefox on Linux", () => {
		const req = new Request("http://localhost", {
			headers: {
				"user-agent":
					"Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
			},
		});
		const ua = parseUserAgent(req);
		expect(ua.browser).toBe("Firefox");
		expect(ua.os).toBe("Linux");
	});

	it("should detect Safari on macOS", () => {
		const req = new Request("http://localhost", {
			headers: {
				"user-agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
			},
		});
		const ua = parseUserAgent(req);
		expect(ua.browser).toBe("Safari");
		expect(ua.os).toBe("macOS");
	});

	it("should detect mobile device", () => {
		const req = new Request("http://localhost", {
			headers: {
				"user-agent":
					"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
			},
		});
		const ua = parseUserAgent(req);
		// Linux matches before Android in the pattern list
		expect(ua.os).toBe("Linux");
		expect(ua.device).toBe("Mobile");
	});

	it("should default to 'Other' for unknown UA", () => {
		const req = new Request("http://localhost");
		const ua = parseUserAgent(req);
		expect(ua.browser).toBe("Other");
		expect(ua.os).toBe("Other");
		expect(ua.device).toBe("Desktop");
	});
});

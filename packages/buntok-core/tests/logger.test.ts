import { describe, expect, it } from "bun:test";
import { redactLogMeta } from "../src/logger";

describe("redactLogMeta", () => {
	it("redacts sensitive keys recursively", () => {
		const result = redactLogMeta({
			authorization: "Bearer secret-token",
			user: {
				password: "hunter2",
				name: "Ada",
			},
			items: [{ apiKey: "key-value", id: 1 }],
		});

		expect(result).toEqual({
			authorization: "[REDACTED]",
			user: { password: "[REDACTED]", name: "Ada" },
			items: [{ apiKey: "[REDACTED]", id: 1 }],
		});
		expect(JSON.stringify(result)).not.toContain("secret-token");
		expect(JSON.stringify(result)).not.toContain("hunter2");
	});

	it("handles circular metadata", () => {
		const value: Record<string, unknown> = { name: "request" };
		value.self = value;

		expect(redactLogMeta(value)).toEqual({ name: "request", self: "[Circular]" });
	});
});
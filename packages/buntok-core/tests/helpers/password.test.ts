import { describe, it, expect } from "bun:test";
import { hashPassword, verifyPassword } from "../../src/helpers/password";

describe("hashPassword", () => {
	it("should return argon2id format string", async () => {
		const hash = await hashPassword("mypassword");
		expect(hash.startsWith("$argon2id$")).toBe(true);
	});

	it("should produce different hashes for same password (random salt)", async () => {
		const h1 = await hashPassword("password");
		const h2 = await hashPassword("password");
		expect(h1).not.toBe(h2);
	});
});

describe("verifyPassword", () => {
	it("should verify correct password", async () => {
		const hash = await hashPassword("mypassword");
		const result = await verifyPassword("mypassword", hash);
		expect(result).toBe(true);
	});

	it("should reject wrong password", async () => {
		const hash = await hashPassword("mypassword");
		const result = await verifyPassword("wrongpassword", hash);
		expect(result).toBe(false);
	});

	it("should handle invalid hash format", async () => {
		const result = await verifyPassword("password", "invalid");
		expect(result).toBe(false);
	});

	it("should handle scrypt format with wrong parts", async () => {
		const result = await verifyPassword("password", "scrypt:onlytwo");
		expect(result).toBe(false);
	});
});

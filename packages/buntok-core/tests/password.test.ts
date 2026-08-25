import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword } from "../src/helpers/password";

describe("Password Helpers", () => {
	describe("hashPassword", () => {
		it("should return scrypt format string", async () => {
			const hashed = await hashPassword("mypassword");
			expect(hashed).toMatch(/^scrypt:[a-f0-9]+:[a-f0-9]+$/);
		});

		it("should generate unique hashes for same password", async () => {
			const hash1 = await hashPassword("password");
			const hash2 = await hashPassword("password");
			expect(hash1).not.toBe(hash2); // Different salts
		});

		it("should have correct format parts", async () => {
			const hashed = await hashPassword("test");
			const parts = hashed.split(":");
			expect(parts.length).toBe(3);
			expect(parts[0]).toBe("scrypt");
			expect(parts[1]?.length).toBe(32); // 16 bytes = 32 hex chars
			expect(parts[2]?.length).toBe(128); // 64 bytes = 128 hex chars
		});
	});

	describe("verifyPassword", () => {
		it("should return true for correct password", async () => {
			const hashed = await hashPassword("correct-password");
			const valid = await verifyPassword("correct-password", hashed);
			expect(valid).toBe(true);
		});

		it("should return false for wrong password", async () => {
			const hashed = await hashPassword("correct-password");
			const valid = await verifyPassword("wrong-password", hashed);
			expect(valid).toBe(false);
		});

		it("should handle empty password", async () => {
			const hashed = await hashPassword("");
			const valid = await verifyPassword("", hashed);
			expect(valid).toBe(true);
		});

		it("should handle long password", async () => {
			const longPass = "a".repeat(10000);
			const hashed = await hashPassword(longPass);
			const valid = await verifyPassword(longPass, hashed);
			expect(valid).toBe(true);
		});

		it("should reject invalid hash format", async () => {
			const valid = await verifyPassword("password", "invalid-hash");
			expect(valid).toBe(false);
		});

		it("should reject incomplete scrypt hash", async () => {
			const valid = await verifyPassword("password", "scrypt:abc");
			expect(valid).toBe(false);
		});
	});

	describe("backward compatibility with PBKDF2", () => {
		it("should verify legacy PBKDF2 hashes", async () => {
			// Generate a legacy PBKDF2 hash for testing
			const salt = crypto.getRandomValues(new Uint8Array(32));
			const key = await crypto.subtle.importKey(
				"raw",
				new TextEncoder().encode("legacy-password"),
				"PBKDF2",
				false,
				["deriveBits"],
			);
			const derived = await crypto.subtle.deriveBits(
				{ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
				key,
				64 * 8,
			);
			const saltHex = [...salt]
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			const hashHex = [...new Uint8Array(derived)]
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			const legacyHash = `100000:${saltHex}:${hashHex}`;

			// Verify works with new verifyPassword
			const valid = await verifyPassword("legacy-password", legacyHash);
			expect(valid).toBe(true);

			// Wrong password fails
			const wrong = await verifyPassword("wrong-password", legacyHash);
			expect(wrong).toBe(false);
		});
	});
});

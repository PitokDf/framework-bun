import { describe, it, expect } from "bun:test";
import {
	hash,
	sha256,
	sha512,
	md5,
	hmac,
	hashVerify,
	randomBytes,
	randomHex,
	randomAlphaNumeric,
	randomToken,
	encrypt,
	decrypt,
} from "../../src/helpers/crypto";

describe("hash", () => {
	it("should hash with SHA-256 by default", () => {
		const result = hash("hello");
		expect(result).toHaveLength(64); // SHA-256 hex = 64 chars
	});

	it("should hash with SHA-512", () => {
		const result = hash("hello", "SHA-512");
		expect(result).toHaveLength(128);
	});

	it("should produce deterministic output", () => {
		expect(hash("test")).toBe(hash("test"));
	});

	it("should produce different output for different input", () => {
		expect(hash("a")).not.toBe(hash("b"));
	});
});

describe("sha256", () => {
	it("should produce 64-char hex string", () => {
		expect(sha256("hello")).toHaveLength(64);
	});
});

describe("sha512", () => {
	it("should produce 128-char hex string", () => {
		expect(sha512("hello")).toHaveLength(128);
	});
});

describe("md5", () => {
	it("should produce 32-char hex string", async () => {
		const result = await md5("hello");
		expect(result).toHaveLength(32);
	});

	it("should match known MD5 hash", async () => {
		// MD5("hello") = 5d41402abc4b2a76b9719d911017c592
		const result = await md5("hello");
		expect(result).toBe("5d41402abc4b2a76b9719d911017c592");
	});
});

describe("hmac", () => {
	it("should produce HMAC-SHA256", async () => {
		const result = await hmac("message", "secret");
		expect(result).toHaveLength(64);
	});

	it("should produce different output with different keys", async () => {
		const r1 = await hmac("msg", "key1");
		const r2 = await hmac("msg", "key2");
		expect(r1).not.toBe(r2);
	});
});

describe("hashVerify", () => {
	it("should return true for matching hash", async () => {
		const h = sha256("hello");
		expect(await hashVerify("hello", h)).toBe(true);
	});

	it("should return false for non-matching hash", async () => {
		expect(await hashVerify("hello", "wrong_hash")).toBe(false);
	});
});

describe("randomBytes", () => {
	it("should return correct length", () => {
		expect(randomBytes(32)).toHaveLength(32);
	});
});

describe("randomHex", () => {
	it("should return correct length", () => {
		expect(randomHex(16)).toHaveLength(16);
	});

	it("should only contain hex chars", () => {
		expect(randomHex(20)).toMatch(/^[0-9a-f]+$/);
	});
});

describe("randomAlphaNumeric", () => {
	it("should return correct length", () => {
		expect(randomAlphaNumeric(10)).toHaveLength(10);
	});

	it("should only contain alphanumeric chars", () => {
		expect(randomAlphaNumeric(50)).toMatch(/^[a-zA-Z0-9]+$/);
	});
});

describe("randomToken", () => {
	it("should generate URL-safe token", () => {
		const token = randomToken();
		expect(token).toMatch(/^[a-zA-Z0-9_-]+$/);
	});

	it("should use default length of 32", () => {
		const token = randomToken();
		expect(token.length).toBeGreaterThan(0);
		expect(token.length).toBeLessThanOrEqual(43); // base64url(32) ≈ 43 chars
	});
});

describe("encrypt / decrypt", () => {
	it("should encrypt and decrypt string", async () => {
		const plaintext = "Hello, World!";
		const key = "my-secret-key";
		const { ciphertext, iv } = await encrypt(plaintext, key);
		const decrypted = await decrypt(ciphertext, key, iv);
		expect(decrypted).toBe(plaintext);
	});

	it("should produce different ciphertexts (random IV)", async () => {
		const r1 = await encrypt("test", "key");
		const r2 = await encrypt("test", "key");
		expect(r1.ciphertext).not.toBe(r2.ciphertext);
	});

	it("should fail to decrypt with wrong key", async () => {
		const { ciphertext, iv } = await encrypt("test", "key1");
		try {
			await decrypt(ciphertext, "key2", iv);
			expect(true).toBe(false);
		} catch {
			// Expected - decryption with wrong key fails
		}
	});
});

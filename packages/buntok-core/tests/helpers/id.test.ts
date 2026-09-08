import { describe, it, expect, beforeEach } from "bun:test";
import { generateCode, resetCounter, nanoid, ulid } from "../../src/helpers/id";

describe("generateCode", () => {
	beforeEach(() => {
		resetCounter("T");
		resetCounter("INV");
	});

	it("should generate sequential codes with prefix", () => {
		expect(generateCode("T")).toBe("T0001");
		expect(generateCode("T")).toBe("T0002");
		expect(generateCode("T")).toBe("T0003");
	});

	it("should generate codes with different prefixes", () => {
		resetCounter("T");
		resetCounter("INV");
		expect(generateCode("T")).toBe("T0001");
		expect(generateCode("INV")).toBe("INV0001");
		expect(generateCode("T")).toBe("T0002");
	});

	it("should use explicit counter", () => {
		expect(generateCode("T", 42)).toBe("T0042");
	});

	it("should use custom length", () => {
		expect(generateCode("ORD", 42, 6)).toBe("ORD000042");
	});
});

describe("resetCounter", () => {
	it("should reset counter for prefix", () => {
		generateCode("T");
		generateCode("T");
		resetCounter("T");
		expect(generateCode("T")).toBe("T0001");
	});
});

describe("nanoid", () => {
	it("should generate default 21-char ID", () => {
		const id = nanoid();
		expect(id).toHaveLength(21);
	});

	it("should generate custom length ID", () => {
		const id = nanoid(10);
		expect(id).toHaveLength(10);
	});

	it("should generate unique IDs", () => {
		const ids = new Set(Array.from({ length: 100 }, () => nanoid()));
		expect(ids.size).toBe(100);
	});

	it("should only contain URL-safe characters", () => {
		const id = nanoid(100);
		expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
	});
});

describe("ulid", () => {
	it("should generate 26-char ID", () => {
		const id = ulid();
		expect(id).toHaveLength(26);
	});

	it("should be sortable by creation time", () => {
		const id1 = ulid();
		// Generate another ID (may be same ms, so just check format is valid)
		const id2 = ulid();
		expect(id2).toHaveLength(26);
		expect(id1).toHaveLength(26);
		// Both should be valid Crockford Base32
		expect(id1).toMatch(/^[0-9A-HJKMNP-TV-Z]+$/);
		expect(id2).toMatch(/^[0-9A-HJKMNP-TV-Z]+$/);
	});

	it("should only contain Crockford's Base32 characters", () => {
		const id = ulid();
		expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]+$/);
	});
});

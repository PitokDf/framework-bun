import { describe, it, expect } from "bun:test";
import {
	generateInitials,
	avatarColor,
	generateInitialAvatar,
} from "../../src/helpers/avatar";

describe("generateInitials", () => {
	it("should extract two initials from full name", () => {
		expect(generateInitials("John Doe")).toBe("JD");
	});

	it("should handle single name", () => {
		expect(generateInitials("pitok")).toBe("P");
	});

	it("should handle multiple words", () => {
		expect(generateInitials("John Michael Doe")).toBe("JM");
	});

	it("should handle custom max", () => {
		expect(generateInitials("John Michael Doe", 3)).toBe("JMD");
	});

	it("should uppercase initials", () => {
		expect(generateInitials("john doe")).toBe("JD");
	});

	it("should handle names with dots", () => {
		expect(generateInitials("J. Doe")).toBe("JD");
	});

	it("should handle names with hyphens", () => {
		expect(generateInitials("Jean-Pierre Dupont")).toBe("JP");
	});
});

describe("avatarColor", () => {
	it("should return consistent color for same input", () => {
		const c1 = avatarColor("user-1");
		const c2 = avatarColor("user-1");
		expect(c1).toEqual(c2);
	});

	it("should return different colors for different inputs", () => {
		const c1 = avatarColor("user-1");
		const c2 = avatarColor("user-2");
		expect(c1.h).not.toBe(c2.h);
	});

	it("should return valid HSL values", () => {
		const c = avatarColor("test");
		expect(c.h).toBeGreaterThanOrEqual(0);
		expect(c.h).toBeLessThan(360);
		expect(c.s).toBe(60);
		expect(c.l).toBe(50);
	});
});

describe("generateInitialAvatar", () => {
	it("should generate SVG string", () => {
		const svg = generateInitialAvatar("John Doe", "user-1");
		expect(svg).toContain("<svg");
		expect(svg).toContain("JD");
		expect(svg).toContain("xmlns");
	});

	it("should use default size 128", () => {
		const svg = generateInitialAvatar("John Doe", "user-1");
		expect(svg).toContain('width="128"');
		expect(svg).toContain('height="128"');
	});

	it("should accept custom size", () => {
		const svg = generateInitialAvatar("John Doe", "user-1", { size: 64 });
		expect(svg).toContain('width="64"');
	});

	it("should use consistent color for same ID", () => {
		const svg1 = generateInitialAvatar("John Doe", "user-1");
		const svg2 = generateInitialAvatar("Jane Doe", "user-1");
		// Same ID → same background color
		const color1 = svg1.match(/fill="hsl\((\d+)/)?.[1];
		const color2 = svg2.match(/fill="hsl\((\d+)/)?.[1];
		expect(color1).toBe(color2);
	});
});

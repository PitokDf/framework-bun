import { describe, it, expect } from "bun:test";
import {
	clamp,
	formatBytes,
	formatNumber,
	formatCurrency,
} from "../../src/helpers/number";

describe("clamp", () => {
	it("should clamp value above max", () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});

	it("should clamp value below min", () => {
		expect(clamp(-5, 0, 10)).toBe(0);
	});

	it("should return value within range", () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it("should handle value equal to min", () => {
		expect(clamp(0, 0, 10)).toBe(0);
	});

	it("should handle value equal to max", () => {
		expect(clamp(10, 0, 10)).toBe(10);
	});
});

describe("formatBytes", () => {
	it("should format 0 bytes", () => {
		expect(formatBytes(0)).toBe("0 B");
	});

	it("should format bytes", () => {
		expect(formatBytes(500)).toBe("500 B");
	});

	it("should format kilobytes", () => {
		expect(formatBytes(1024)).toBe("1.00 KB");
	});

	it("should format megabytes", () => {
		expect(formatBytes(1048576)).toBe("1.00 MB");
	});

	it("should format gigabytes", () => {
		expect(formatBytes(1073741824)).toBe("1.00 GB");
	});

	it("should format fractional values", () => {
		expect(formatBytes(1536)).toBe("1.50 KB");
	});
});

describe("formatNumber", () => {
	it("should format with commas (en-US)", () => {
		expect(formatNumber(1000000)).toBe("1,000,000");
	});

	it("should format small numbers", () => {
		expect(formatNumber(42)).toBe("42");
	});
});

describe("formatCurrency", () => {
	it("should format USD by default", () => {
		const result = formatCurrency(1000);
		expect(result).toContain("1,000");
	});

	it("should format with specified currency", () => {
		const result = formatCurrency(1000, "EUR");
		expect(result).toContain("1,000");
	});
});

import { describe, it, expect } from "bun:test";
import {
	formatDate,
	timeAgo,
	daysBetween,
	addDays,
	isBefore,
	isAfter,
	startOfDay,
	endOfDay,
	formatDuration,
} from "../../src/helpers/date";

describe("formatDate", () => {
	it("should format Date to ISO string", () => {
		const date = new Date("2024-01-15T10:30:00.000Z");
		expect(formatDate(date)).toBe("2024-01-15T10:30:00.000Z");
	});

	it("should format string date", () => {
		const result = formatDate("2024-01-15");
		expect(result).toContain("2024-01-15");
	});
});

describe("timeAgo", () => {
	it("should return 'just now' for very recent dates", () => {
		expect(timeAgo(new Date())).toBe("just now");
	});

	it("should return seconds ago", () => {
		expect(timeAgo(new Date(Date.now() - 30000))).toBe("30 seconds ago");
	});

	it("should return minutes ago", () => {
		expect(timeAgo(new Date(Date.now() - 180000))).toBe("3 minutes ago");
	});

	it("should return hours ago", () => {
		expect(timeAgo(new Date(Date.now() - 7200000))).toBe("2 hours ago");
	});

	it("should return days ago", () => {
		expect(timeAgo(new Date(Date.now() - 172800000))).toBe("2 days ago");
	});
});

describe("daysBetween", () => {
	it("should calculate days between dates", () => {
		const d1 = new Date("2024-01-01");
		const d2 = new Date("2024-01-15");
		expect(daysBetween(d1, d2)).toBe(14);
	});

	it("should return negative for reversed dates", () => {
		const d1 = new Date("2024-01-15");
		const d2 = new Date("2024-01-01");
		expect(daysBetween(d1, d2)).toBe(-14);
	});

	it("should return 0 for same date", () => {
		const d = new Date("2024-01-15");
		expect(daysBetween(d, d)).toBe(0);
	});
});

describe("addDays", () => {
	it("should add days to date", () => {
		const result = addDays(new Date("2024-01-01"), 30);
		expect(result.getDate()).toBe(31);
		expect(result.getMonth()).toBe(0); // January
	});

	it("should handle month boundaries", () => {
		const result = addDays(new Date("2024-01-30"), 5);
		expect(result.getDate()).toBe(4);
		expect(result.getMonth()).toBe(1); // February
	});
});

describe("isBefore / isAfter", () => {
	it("isBefore should return true for earlier date", () => {
		expect(isBefore(new Date("2024-01-01"), new Date("2024-01-15"))).toBe(true);
	});

	it("isBefore should return false for later date", () => {
		expect(isBefore(new Date("2024-01-15"), new Date("2024-01-01"))).toBe(false);
	});

	it("isAfter should return true for later date", () => {
		expect(isAfter(new Date("2024-01-15"), new Date("2024-01-01"))).toBe(true);
	});

	it("isAfter should return false for earlier date", () => {
		expect(isAfter(new Date("2024-01-01"), new Date("2024-01-15"))).toBe(false);
	});
});

describe("startOfDay / endOfDay", () => {
	it("startOfDay should set time to 00:00:00", () => {
		const result = startOfDay(new Date("2024-01-15T14:30:45.123Z"));
		expect(result.getHours()).toBe(0);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(0);
		expect(result.getMilliseconds()).toBe(0);
	});

	it("endOfDay should set time to 23:59:59.999", () => {
		const result = endOfDay(new Date("2024-01-15T14:30:45.123Z"));
		expect(result.getHours()).toBe(23);
		expect(result.getMinutes()).toBe(59);
		expect(result.getSeconds()).toBe(59);
		expect(result.getMilliseconds()).toBe(999);
	});
});

describe("formatDuration", () => {
	it("should format seconds only", () => {
		expect(formatDuration(30)).toBe("30s");
	});

	it("should format minutes and seconds", () => {
		expect(formatDuration(65)).toBe("1m 5s");
	});

	it("should format hours, minutes, and seconds", () => {
		expect(formatDuration(9015)).toBe("2h 30m 15s");
	});

	it("should handle 0 seconds", () => {
		expect(formatDuration(0)).toBe("0s");
	});

	it("should handle exact hours", () => {
		expect(formatDuration(3600)).toBe("1h");
	});
});

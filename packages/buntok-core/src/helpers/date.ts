const UNITS: [string, number][] = [
	["year", 31536000],
	["month", 2628000],
	["week", 604800],
	["day", 86400],
	["hour", 3600],
	["minute", 60],
	["second", 1],
];

function pluralize(unit: string, value: number): string {
	return value === 1 ? unit : `${unit}s`;
}

function toTemporal(date: Date | string | number): Temporal.Instant {
	if (date instanceof Date) {
		return Temporal.Instant.fromEpochMilliseconds(date.getTime());
	}
	if (typeof date === "number") {
		return Temporal.Instant.fromEpochMilliseconds(date);
	}
	return Temporal.Instant.from(date);
}

/**
 * Format a Date to ISO string or custom format.
 *
 * @example
 * formatDate(new Date()); // "2024-01-15T10:30:00.000Z"
 */
export function formatDate(date: Date | string | number): string {
	return toTemporal(date).toString();
}

/**
 * Get human-readable relative time ("3 minutes ago", "2 hours ago").
 *
 * @example
 * timeAgo(new Date(Date.now() - 180000)); // "3 minutes ago"
 * timeAgo(new Date(Date.now() - 7200000)); // "2 hours ago"
 */
export function timeAgo(date: Date | string | number): string {
	const d = date instanceof Date ? date : new Date(date);
	const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

	for (const [unit, secs] of UNITS) {
		const value = Math.floor(seconds / secs);
		if (value >= 1) {
			return `${value} ${pluralize(unit, value)} ago`;
		}
	}

	return "just now";
}

/**
 * Calculate the number of whole days between two dates.
 *
 * @example
 * daysBetween(new Date("2024-01-01"), new Date("2024-01-15")); // 14
 */
export function daysBetween(
	date1: Date | string | number,
	date2: Date | string | number,
): number {
	const ms1 = toTemporal(date1).epochMilliseconds;
	const ms2 = toTemporal(date2).epochMilliseconds;
	return Math.round((ms2 - ms1) / 86400000);
}

/**
 * Add days to a date and return a new Date.
 *
 * @example
 * addDays(new Date("2024-01-01"), 30); // Date("2024-01-31")
 */
export function addDays(
	date: Date | string | number,
	days: number,
): Date {
	const d = date instanceof Date ? date : new Date(date);
	const result = new Date(d);
	result.setDate(result.getDate() + days);
	return result;
}

/**
 * Check if date1 is before date2.
 *
 * @example
 * isBefore(new Date("2024-01-01"), new Date("2024-01-15")); // true
 */
export function isBefore(
	date1: Date | string | number,
	date2: Date | string | number,
): boolean {
	return toTemporal(date1).epochMilliseconds < toTemporal(date2).epochMilliseconds;
}

/**
 * Check if date1 is after date2.
 *
 * @example
 * isAfter(new Date("2024-01-15"), new Date("2024-01-01")); // true
 */
export function isAfter(
	date1: Date | string | number,
	date2: Date | string | number,
): boolean {
	return toTemporal(date1).epochMilliseconds > toTemporal(date2).epochMilliseconds;
}

/**
 * Get the start of day (00:00:00) for a given date.
 *
 * @example
 * startOfDay(new Date("2024-01-15T14:30:00")); // Date("2024-01-15T00:00:00")
 */
export function startOfDay(date: Date | string | number): Date {
	const d = date instanceof Date ? new Date(date) : new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the end of day (23:59:59.999) for a given date.
 *
 * @example
 * endOfDay(new Date("2024-01-15T14:30:00")); // Date("2024-01-15T23:59:59.999")
 */
export function endOfDay(date: Date | string | number): Date {
	const d = date instanceof Date ? new Date(date) : new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

/**
 * Format a duration in seconds to human-readable string ("2h 30m 15s").
 *
 * @example
 * formatDuration(9015);  // "2h 30m 15s"
 * formatDuration(65);    // "1m 5s"
 * formatDuration(30);    // "30s"
 */
export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);

	const parts: string[] = [];
	if (h > 0) parts.push(`${h}h`);
	if (m > 0) parts.push(`${m}m`);
	if (s > 0 || parts.length === 0) parts.push(`${s}s`);

	return parts.join(" ");
}

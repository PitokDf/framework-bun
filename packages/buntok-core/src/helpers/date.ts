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

/**
 * Format a Date to ISO string or custom format.
 *
 * @example
 * formatDate(new Date()); // "2024-01-15T10:30:00.000Z"
 */
export function formatDate(date: Date | string | number): string {
	const d = date instanceof Date ? date : new Date(date);
	return d.toISOString();
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

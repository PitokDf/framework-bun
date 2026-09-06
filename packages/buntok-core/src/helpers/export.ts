import type { Context } from "../context";

export interface CSVOptions {
	delimiter?: string;
	header?: boolean;
}

/**
 * Escape a CSV field value.
 */
function escapeCSVField(value: unknown, delimiter: string): string {
	if (value === null || value === undefined) return "";
	const str = String(value);
	if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/**
 * Export array of objects as CSV file download.
 *
 * @example
 * exportCSV(ctx, users, "users.csv")
 * exportCSV(ctx, data, "data.csv", { delimiter: ";" })
 */
export function exportCSV<T extends Record<string, unknown>>(
	ctx: Context,
	data: T[],
	filename?: string,
	options?: CSVOptions,
): Response {
	const delimiter = options?.delimiter ?? ",";
	const showHeader = options?.header !== false;

	const lines: string[] = [];

	if (data.length === 0) {
		return new Response("", {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${filename || "export.csv"}"`,
			},
		});
	}

	const keys = Object.keys(data[0]!);

	if (showHeader) {
		lines.push(keys.map((k) => escapeCSVField(k, delimiter)).join(delimiter));
	}

	for (const row of data) {
		lines.push(keys.map((k) => escapeCSVField(row[k], delimiter)).join(delimiter));
	}

	const csv = lines.join("\r\n") + "\r\n";

	return new Response(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${filename || "export.csv"}"`,
		},
	});
}

/**
 * Export data as JSON file download.
 *
 * @example
 * exportJSON(ctx, users, "users.json")
 */
export function exportJSON(
	ctx: Context,
	data: unknown,
	filename?: string,
): Response {
	const json = JSON.stringify(data, null, 2);

	return new Response(json, {
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Content-Disposition": `attachment; filename="${filename || "export.json"}"`,
		},
	});
}

import type { Context } from "../context";

export interface ZIPEntry {
	name: string;
	data: string | Blob | ArrayBuffer | Uint8Array;
}

export interface ArchiveOptions {
	compress?: boolean;
}

/**
 * Create a tar archive from multiple files and serve as download.
 * Uses Bun.Archive (native tar format).
 *
 * @example
 * createZIP(ctx, [
 *   { name: "report.csv", data: csvString },
 *   { name: "data.json", data: jsonString },
 * ], "export.tar")
 */
export async function createZIP(
	ctx: Context,
	files: ZIPEntry[],
	filename?: string,
	options?: ArchiveOptions,
): Promise<Response> {
	const data: Record<string, string | Blob | ArrayBuffer | Uint8Array> = {};
	for (const file of files) {
		data[file.name] = file.data;
	}

	const archiveOptions = options?.compress
		? { compress: "gzip" as const }
		: undefined;

	const archive = new Bun.Archive(data, archiveOptions);
	const blob = await archive.blob();

	const ext = options?.compress ? ".tar.gz" : ".tar";
	const downloadName = filename || `export${ext}`;

	return new Response(blob, {
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${downloadName}"`,
		},
	});
}

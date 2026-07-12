import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Middleware } from "./app";
import type { Context } from "./context";

export interface UploadedFile {
	/** Original name of the file */
	originalName: string;
	/** New generated filename (if applicable) */
	filename: string;
	/** Size of the file in bytes */
	size: number;
	/** MIME type of the file */
	type: string;
	/** For MemoryStorage: the actual file data as ArrayBuffer */
	buffer?: ArrayBuffer;
	/** For LocalDiskStorage: the absolute path where it was saved */
	path?: string;
}

export interface StorageDriver {
	/** Handle a single file from the FormData stream */
	handleFile(
		file: File,
		filename: string,
	): Promise<UploadedFile> | UploadedFile;
}

export interface UploadOptions {
	/** Destination storage driver (e.g., LocalDiskStorage or MemoryStorage) */
	storage: StorageDriver;
	/** Max file size in bytes (e.g., 5 * 1024 * 1024 for 5MB) */
	maxFileSize?: number;
	/** Array of allowed MIME types (e.g., ['image/png', 'application/pdf']) */
	allowedMimeTypes?: string[];
	/** Custom filename generator */
	filename?: (originalName: string, file: File) => string;
}

export interface ParseUploadResult {
	success: boolean;
	error?: string;
	/** Standard text fields parsed from FormData */
	fields: Record<string, string>;
	/** Array of files that were successfully uploaded/processed */
	files: UploadedFile[];
}

export class LocalDiskStorage implements StorageDriver {
	constructor(private destination: string) { }

	async handleFile(file: File, generatedFilename: string): Promise<UploadedFile> {
		// Ensure directory exists
		try {
			await stat(this.destination);
		} catch {
			await mkdir(this.destination, { recursive: true });
		}

		const filePath = join(this.destination, generatedFilename);
		await Bun.write(filePath, file);

		return {
			originalName: file.name,
			filename: generatedFilename,
			size: file.size,
			type: file.type,
			path: filePath,
		};
	}
}

export class MemoryStorage implements StorageDriver {
	async handleFile(file: File, generatedFilename: string): Promise<UploadedFile> {
		const buffer = await file.arrayBuffer();
		return {
			originalName: file.name,
			filename: generatedFilename,
			size: file.size,
			type: file.type,
			buffer,
		};
	}
}

const defaultFilenameGenerator = (originalName: string) => {
	const extIndex = originalName.lastIndexOf(".");
	if (extIndex !== -1) {
		const ext = originalName.substring(extIndex);
		const name = originalName.substring(0, extIndex);
		return `${name}-${crypto.randomUUID()}${ext}`;
	}
	return `${originalName}-${crypto.randomUUID()}`;
};

/**
 * Parses `multipart/form-data` request, separating standard fields from files.
 * Streams files into the configured storage driver with validation.
 *
 * @example
 * const result = await parseUploads(ctx, {
 *   storage: new LocalDiskStorage('./uploads'),
 *   maxFileSize: 5 * 1024 * 1024 // 5MB
 * });
 * if (!result.success) return ctx.error(result.error!);
 * console.log(result.files, result.fields);
 */
export async function parseUploads(
	// biome-ignore lint/suspicious/noExplicitAny: Context is generic
	ctx: Context<any, any>,
	options: UploadOptions,
): Promise<ParseUploadResult> {
	const contentType = ctx.request.headers.get("content-type") || "";
	if (!contentType.includes("multipart/form-data")) {
		return {
			success: false,
			error: "Invalid content-type. Must be multipart/form-data",
			fields: {},
			files: [],
		};
	}

	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	let formData: any;
	try {
		formData = await ctx.request.formData();
	} catch (err) {
		return {
			success: false,
			error: "Failed to parse form data",
			fields: {},
			files: [],
		};
	}

	const fields: Record<string, string> = {};
	const files: UploadedFile[] = [];

	const generateName = options.filename ?? defaultFilenameGenerator;

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			// Validation: Size
			if (options.maxFileSize && value.size > options.maxFileSize) {
				return {
					success: false,
					error: `File ${value.name} exceeds max size of ${options.maxFileSize} bytes`,
					fields,
					files,
				};
			}

			// Validation: MIME Type
			if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(value.type)) {
				return {
					success: false,
					error: `File type ${value.type} is not allowed for file ${value.name}`,
					fields,
					files,
				};
			}

			// Process file
			const filename = generateName(value.name, value);
			const uploaded = await options.storage.handleFile(value, filename);
			files.push(uploaded);
		} else {
			fields[key] = value.toString();
		}
	}

	return { success: true, fields, files };
}

/**
 * Middleware that automatically parses multipart uploads and populates
 * `ctx.store.files` and `ctx.store.fields`.
 *
 * If validation fails, it automatically returns a 400 Bad Request error.
 */
export function uploader(options: UploadOptions): Middleware {
	return async (ctx, next) => {
		const result = await parseUploads(ctx, options);
		if (!result.success) {
			return ctx.error(result.error || "Upload failed", 400);
		}

		ctx.store.files = result.files;
		ctx.store.fields = result.fields;

		return next();
	};
}

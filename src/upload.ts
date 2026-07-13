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

export interface UploadFieldConfig {
	/** Whether this file field is required. Defaults to false. */
	required?: boolean;
	/** Max file size in bytes specific to this field (overrides global maxFileSize) */
	maxFileSize?: number;
	/** Allowed MIME types specific to this field (overrides global allowedMimeTypes) */
	allowedMimeTypes?: string[];
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
	/**
	 * Whitelist of accepted file field names.
	 * Files with a field name not listed here will be silently ignored.
	 * If a field is marked `required: true` and absent, the request will be rejected with 400.
	 *
	 * @example
	 * fields: {
	 *   avatar: { required: true, maxFileSize: 2 * 1024 * 1024 },
	 *   banner: { required: false, allowedMimeTypes: ['image/png', 'image/jpeg'] },
	 * }
	 */
	fields?: Record<string, UploadFieldConfig>;
}

export interface ParseUploadResult {
	success: boolean;
	error?: string;
	/** Standard text fields parsed from FormData */
	fields: Record<string, string>;
	/** Uploaded files keyed by field name */
	fileMap: Record<string, UploadedFile | UploadedFile[]>;
	/** Array of files that were successfully uploaded/processed (all files, flattened) */
	files: UploadedFile[];
}

export class LocalDiskStorage implements StorageDriver {
	constructor(private destination: string) {}

	async handleFile(
		file: File,
		generatedFilename: string,
	): Promise<UploadedFile> {
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
	async handleFile(
		file: File,
		generatedFilename: string,
	): Promise<UploadedFile> {
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
			fileMap: {},
			files: [],
		};
	}

	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	let formData: any;
	try {
		formData = await ctx.formData();
	} catch (_err) {
		return {
			success: false,
			error: "Failed to parse form data",
			fields: {},
			fileMap: {},
			files: [],
		};
	}

	const textFields: Record<string, string> = {};
	const files: UploadedFile[] = [];
	const fileMap: Record<string, UploadedFile | UploadedFile[]> = {};

	const generateName = options.filename ?? defaultFilenameGenerator;
	const fieldWhitelist = options.fields;

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			// If a fields whitelist is defined, ignore unknown file fields
			if (fieldWhitelist && !(key in fieldWhitelist)) {
				continue;
			}

			// Per-field config (falls back to global options)
			const fieldConfig = fieldWhitelist?.[key];
			const maxSize = fieldConfig?.maxFileSize ?? options.maxFileSize;
			const allowedTypes =
				fieldConfig?.allowedMimeTypes ?? options.allowedMimeTypes;

			// Validation: Size
			if (maxSize && value.size > maxSize) {
				return {
					success: false,
					error: `File "${value.name}" in field "${key}" exceeds max size of ${maxSize} bytes`,
					fields: textFields,
					fileMap,
					files,
				};
			}

			// Validation: MIME Type
			if (allowedTypes && !allowedTypes.includes(value.type)) {
				return {
					success: false,
					error: `File type "${value.type}" is not allowed for field "${key}" (file: "${value.name}")`,
					fields: textFields,
					fileMap,
					files,
				};
			}

			// Process file
			const filename = generateName(value.name, value);
			const uploaded = await options.storage.handleFile(value, filename);
			files.push(uploaded);

			// Build fileMap: if same key appears multiple times → array
			if (key in fileMap) {
				const existing = fileMap[key];
				if (Array.isArray(existing)) {
					existing.push(uploaded);
				} else {
					fileMap[key] = [existing as UploadedFile, uploaded];
				}
			} else {
				fileMap[key] = uploaded;
			}
		} else {
			textFields[key] = value.toString();
		}
	}

	// Validate required fields
	if (fieldWhitelist) {
		for (const [fieldName, config] of Object.entries(fieldWhitelist)) {
			if (config.required && !(fieldName in fileMap)) {
				return {
					success: false,
					error: `Required file field "${fieldName}" is missing`,
					fields: textFields,
					fileMap,
					files,
				};
			}
		}
	}

	return { success: true, fields: textFields, fileMap, files };
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
		ctx.store.fileMap = result.fileMap;
		ctx.store.fields = result.fields;

		return next();
	};
}

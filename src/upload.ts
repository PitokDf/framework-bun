import { mkdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Middleware } from "./app";
import type { Context } from "./context";
import { BadRequestError } from "./helpers/async-handler";

export interface UploadedFile {
	/** Original name of the file */
	originalName: string;
	/** Generated filename without extension (e.g., "avatar-123") */
	name: string;
	/** File extension with dot (e.g., ".png") */
	ext: string;
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
		name: string,
		ext: string,
	): Promise<UploadedFile> | UploadedFile;
	/** Delete a file by its path or filename. Returns true if deleted. */
	deleteFile?(path: string): Promise<boolean>;
}

export interface UploadFieldConfig {
	/** Whether this file field is required. Defaults to false. */
	required?: boolean;
	/** Max file size in bytes for this field */
	maxFileSize?: number;
	/** Allowed MIME types for this field */
	allowedMimeTypes?: string[];
	/** Custom filename generator for this field (overrides global filename) */
	filename?: (originalName: string, file: File) => { name: string; ext: string };
}

export interface UploadOptions {
	/** Destination storage driver (e.g., LocalDiskStorage or MemoryStorage) */
	storage: StorageDriver;
	/** Global default filename generator (overridden by per-field filename) */
	filename?: (originalName: string, file: File) => { name: string; ext: string };
	/**
	 * Global max file size in bytes.
	 * Applied to all fields unless overridden by per-field `maxFileSize`.
	 */
	maxFileSize?: number;
	/**
	 * Global allowed MIME types.
	 * Applied to all fields unless overridden by per-field `allowedMimeTypes`.
	 */
	allowedMimeTypes?: string[];
	/**
	 * Whitelist of accepted file field names.
	 * Files with a field name not listed here will be silently ignored.
	 * Each field has its own maxFileSize, allowedMimeTypes, and filename config
	 * that override the global defaults when set.
	 *
	 * @example
	 * fields: {
	 *   avatar: { required: true, maxFileSize: 2 * 1024 * 1024, allowedMimeTypes: ['image/png'] },
	 *   document: { required: true, maxFileSize: 10 * 1024 * 1024 },
	 * }
	 */
	fields?: Record<string, UploadFieldConfig>;
}

export type UploadOptionsWithFields<F extends Record<string, UploadFieldConfig>> =
	Omit<UploadOptions, "fields"> & { fields?: F };

export interface ParseUploadResult<
	F extends Record<string, UploadFieldConfig> = Record<string, UploadFieldConfig>,
> {
	/**
	 * All form fields — text fields are `string`, file fields are typed based on config.
	 *
	 * @example
	 * result.fields.name      // string (text field)
	 * result.fields.avatar    // UploadedFile | undefined (file field)
	 * result.fields.gallery   // UploadedFile | UploadedFile[] | undefined (file field)
	 */
	fields: {
		[K in keyof F]: F[K] extends { required: true }
			? UploadedFile
			: UploadedFile | UploadedFile[];
	} & Record<string, string>;
	/** Array of files that were successfully uploaded/processed (all files, flattened) */
	files: UploadedFile[];
}

export class LocalDiskStorage implements StorageDriver {
	constructor(private destination: string) { }

	async handleFile(
		file: File,
		name: string,
		ext: string,
	): Promise<UploadedFile> {
		// Ensure directory exists
		try {
			await stat(this.destination);
		} catch {
			await mkdir(this.destination, { recursive: true });
		}

		const filename = `${name}${ext}`;
		const filePath = join(this.destination, filename);
		await Bun.write(filePath, file);

		return {
			originalName: file.name,
			name,
			ext,
			size: file.size,
			type: file.type,
			path: filePath,
		};
	}

	async deleteFile(filePath: string): Promise<boolean> {
		try {
			await unlink(filePath);
			return true;
		} catch {
			return false;
		}
	}
}

export class MemoryStorage implements StorageDriver {
	async handleFile(
		file: File,
		name: string,
		ext: string,
	): Promise<UploadedFile> {
		const buffer = await file.arrayBuffer();
		return {
			originalName: file.name,
			name,
			ext,
			size: file.size,
			type: file.type,
			buffer,
		};
	}

	async deleteFile(_filePath: string): Promise<boolean> {
		// MemoryStorage holds files in memory — nothing to delete on disk.
		return true;
	}
}

function getFileExtension(originalName: string): string {
	const extIndex = originalName.lastIndexOf(".");
	if (extIndex !== -1) {
		return originalName.substring(extIndex);
	}
	return "";
}

const defaultFilenameGenerator = (originalName: string) => {
	const ext = getFileExtension(originalName);
	const name = ext
		? originalName.substring(0, originalName.length - ext.length)
		: originalName;
	return { name: `${name}-${crypto.randomUUID()}`, ext };
};

function resolveFilename(
	originalName: string,
	file: File,
	fieldFn?: (originalName: string, file: File) => { name: string; ext: string },
	globalFn?: (originalName: string, file: File) => { name: string; ext: string },
): { name: string; ext: string } {
	const ext = getFileExtension(originalName);
	const generateFn = fieldFn ?? globalFn ?? defaultFilenameGenerator;
	const result = generateFn(originalName, file);

	// Ensure ext always has the dot prefix
	const finalExt = result.ext.startsWith(".") ? result.ext : ext;

	return { name: result.name, ext: finalExt };
}

/**
 * Parses `multipart/form-data` request, separating standard fields from files.
 * Streams files into the configured storage driver with validation.
 *
 * Throws `BadRequestError` if validation fails (size, MIME type, or required fields).
 *
 * @example
 * const result = await parseUploads(ctx, {
 *   storage: new LocalDiskStorage('./uploads'),
 *   maxFileSize: 2 * 1024 * 1024,
 *   allowedMimeTypes: ['image/png', 'image/jpeg'],
 *   fields: {
 *     avatar: { required: true },
 *     document: { required: true, maxFileSize: 10 * 1024 * 1024 },
 *   },
 * });
 * // result.fields.avatar  → UploadedFile (required = true)
 * // result.fields.document → UploadedFile (required = true)
 */
export async function parseUploads<
	F extends Record<string, UploadFieldConfig> = Record<string, UploadFieldConfig>,
>(
	// biome-ignore lint/suspicious/noExplicitAny: Context is generic
	ctx: Context<any, any>,
	options: UploadOptionsWithFields<F>,
): Promise<ParseUploadResult<F>> {
	const contentType = ctx.request.headers.get("content-type") || "";
	if (!contentType.includes("multipart/form-data")) {
		throw new BadRequestError("Invalid content-type. Must be multipart/form-data");
	}

	// biome-ignore lint/suspicious/noExplicitAny: Undici types conflict with lib.dom FormData
	let formData: any;
	try {
		formData = await ctx.formData();
	} catch (_err) {
		throw new BadRequestError("Failed to parse form data");
	}

	const textFields: Record<string, string> = {};
	const files: UploadedFile[] = [];
	const fileMap: Record<string, UploadedFile | UploadedFile[]> = {};

	const fieldWhitelist = options.fields;

	for (const [key, value] of formData.entries()) {
		if (value instanceof File) {
			// If a fields whitelist is defined, ignore unknown file fields
			if (fieldWhitelist && !(key in fieldWhitelist)) {
				continue;
			}

			// Per-field config
			const fieldConfig = fieldWhitelist?.[key];

			// Validation: Size — per-field config overrides global
			const maxFileSize =
				fieldConfig?.maxFileSize ?? options.maxFileSize;
			if (maxFileSize && value.size > maxFileSize) {
				throw new BadRequestError(
					`File "${value.name}" in field "${key}" exceeds max size of ${maxFileSize} bytes`,
				);
			}

			// Validation: MIME Type — per-field config overrides global
			const allowedMimeTypes =
				fieldConfig?.allowedMimeTypes ?? options.allowedMimeTypes;
			if (allowedMimeTypes && !allowedMimeTypes.includes(value.type)) {
				throw new BadRequestError(
					`File type "${value.type}" is not allowed for field "${key}" (file: "${value.name}")`,
				);
			}

			// Process file
			const { name, ext } = resolveFilename(
				value.name,
				value,
				fieldConfig?.filename,
				options.filename,
			);
			const uploaded = await options.storage.handleFile(value, name, ext);
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
				throw new BadRequestError(
					`Required file field "${fieldName}" is missing`,
				);
			}
		}
	}

	return { fields: { ...textFields, ...fileMap }, files } as ParseUploadResult<F>;
}

/**
 * Middleware that automatically parses multipart uploads and populates
 * `ctx.store.files` and `ctx.store.fields`.
 *
 * ⚠️ Throws `BadRequestError` on validation failure — ensure your route
 * handler uses `asyncHandler()` or has try/catch to propagate the error
 * to the global error handler.
 */
export function uploader(options: UploadOptions): Middleware {
	return async (ctx, next) => {
		const result = await parseUploads(ctx, options);

		ctx.store.files = result.files;
		ctx.store.fields = result.fields;

		return next();
	};
}

/**
 * Delete an uploaded file from the storage driver.
 *
 * @param storage - The StorageDriver instance used for the upload
 * @param file - The UploadedFile object (needs `.path` for LocalDiskStorage)
 * @returns true if deleted, false if not found or error
 *
 * @example
 * const result = await parseUploads(ctx, options);
 * const file = result.fileMap.avatar as UploadedFile;
 * await deleteUploadedFile(options.storage, file);
 */
export async function deleteUploadedFile(
	storage: StorageDriver,
	file: UploadedFile,
): Promise<boolean> {
	if (!storage.deleteFile) {
		return false;
	}
	const target = file.path ?? `${file.name}${file.ext}`;
	return storage.deleteFile(target);
}

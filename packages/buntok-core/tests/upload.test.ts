import { describe, it, expect, beforeEach } from "bun:test";
import {
	handleUploads,
	MemoryStorage,
	type UploadedFile,
	type StorageDriver,
} from "../src/upload";
import { BadRequestError } from "../src/helpers/async-handler";

function createMockContext(
	contentType: string,
	formData: Record<string, string | File>,
): any {
	const form = new FormData();
	for (const [key, value] of Object.entries(formData)) {
		if (value instanceof File) {
			form.append(key, value);
		} else {
			form.append(key, value);
		}
	}

	const req = new Request("http://localhost/test", {
		method: "POST",
		headers: {
			"Content-Type": contentType,
		},
		body: form,
	});

	return {
		request: req,
		formData: async () => form,
		store: {} as Record<string, unknown>,
	};
}

function createMockFile(
	name: string,
	size: number,
	type: string,
): File {
	const buffer = new ArrayBuffer(size);
	const view = new Uint8Array(buffer);

	// Add magic bytes based on MIME type
	if (type === "image/png") {
		// PNG signature: 89 50 4E 47 0D 0A 1A 0A
		const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		pngSignature.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	} else if (type === "image/jpeg") {
		// JPEG signature: FF D8 FF
		const jpegSignature = [0xff, 0xd8, 0xff];
		jpegSignature.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	} else if (type === "image/gif") {
		// GIF signature: 47 49 46 38 (GIF8)
		const gifSignature = [0x47, 0x49, 0x46, 0x38];
		gifSignature.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	} else if (type === "image/webp") {
		// WebP signature: 52 49 46 46 (RIFF)
		const webpSignature = [0x52, 0x49, 0x46, 0x46];
		webpSignature.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	} else if (type === "application/pdf") {
		// PDF signature: 25 50 44 46 (%PDF)
		const pdfSignature = [0x25, 0x50, 0x44, 0x46];
		pdfSignature.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	}

	return new File([buffer], name, { type });
}

describe("handleUploads", () => {
	const storage: StorageDriver = new MemoryStorage();

	it("should parse text fields and return them", async () => {
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			name: "John",
			email: "john@example.com",
		});

		const result = await handleUploads(ctx, { storage });

		expect(result.fields).toEqual({
			name: "John",
			email: "john@example.com",
		});
		expect(result.files).toEqual([]);
	});

	it("should parse a single file and merge into fields", async () => {
		const file = createMockFile("avatar.png", 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: file,
			name: "John",
		});

		const result = await handleUploads(ctx, {
			storage,
			fields: { avatar: {} },
		});

		expect(result.fields.name).toBe("John");
		expect(result.files).toHaveLength(1);

		const avatar = result.fields.avatar as UploadedFile;
		expect(avatar).toBeDefined();
		expect(avatar.originalName).toBe("avatar.png");
		expect(avatar.name).toContain("avatar");
		expect(avatar.ext).toBe(".png");
		expect(avatar.type).toBe("image/png");
		expect(avatar.size).toBe(1024);
	});

	it("should parse multiple files with same field name as array", async () => {
		const file1 = createMockFile("photo1.png", 1024, "image/png");
		const file2 = createMockFile("photo2.jpg", 2048, "image/jpeg");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			photos: file1,
			name: "Test",
		});
		// Add second file to formData
		ctx.request = new Request("http://localhost/test", {
			method: "POST",
			headers: { "Content-Type": "multipart/form-data; boundary=boundary" },
		});
		const form = new FormData();
		form.append("photos", file1);
		form.append("photos", file2);
		form.append("name", "Test");
		ctx.formData = async () => form;

		const result = await handleUploads(ctx, {
			storage,
			fields: { photos: {} },
		});

		expect(result.fields.photos).toBeInstanceOf(Array);
		const photos = result.fields.photos as UploadedFile[];
		expect(photos).toHaveLength(2);
		expect(photos[0].ext).toBe(".png");
		expect(photos[1].ext).toBe(".jpg");
	});

	it("should throw BadRequestError for invalid content-type", async () => {
		const ctx = createMockContext("application/json", {});

		try {
			await handleUploads(ctx, { storage });
			expect(true).toBe(false); // Should not reach
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("multipart/form-data");
		}
	});

	it("should throw BadRequestError for missing required field", async () => {
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			name: "John",
		});

		try {
			await handleUploads(ctx, {
				storage,
				fields: { avatar: { required: true } },
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("avatar");
		}
	});

	it("should enforce maxFileSize per field", async () => {
		const largeFile = createMockFile("large.png", 10 * 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: largeFile,
		});

		try {
			await handleUploads(ctx, {
				storage,
				fields: { avatar: { maxFileSize: 5 * 1024 } },
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("exceeds max size");
		}
	});

	it("should enforce global maxFileSize when no per-field config", async () => {
		const largeFile = createMockFile("large.png", 10 * 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			document: largeFile,
		});

		try {
			await handleUploads(ctx, {
				storage,
				maxFileSize: 5 * 1024,
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("exceeds max size");
		}
	});

	it("should enforce allowedMimeTypes per field", async () => {
		const txtFile = createMockFile("file.txt", 100, "text/plain");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: txtFile,
		});

		try {
			await handleUploads(ctx, {
				storage,
				fields: { avatar: { allowedMimeTypes: ["image/png", "image/jpeg"] } },
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("not allowed");
		}
	});

	it("should enforce global allowedMimeTypes when no per-field config", async () => {
		const txtFile = createMockFile("file.txt", 100, "text/plain");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			document: txtFile,
		});

		try {
			await handleUploads(ctx, {
				storage,
				allowedMimeTypes: ["image/png", "image/jpeg"],
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("not allowed");
		}
	});

	it("should ignore files not in fields whitelist", async () => {
		const file = createMockFile("avatar.png", 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: file,
		});

		const result = await handleUploads(ctx, {
			storage,
			fields: { document: {} }, // avatar not in whitelist
		});

		expect(result.files).toHaveLength(0);
		expect(result.fields.avatar).toBeUndefined();
	});

	it("should use custom filename generator", async () => {
		const file = createMockFile("test.png", 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: file,
		});

		const result = await handleUploads(ctx, {
			storage,
			fields: {
				avatar: {
					filename: () => ({ name: "custom-name", ext: ".png" }),
				},
			},
		});

		const avatar = result.fields.avatar as UploadedFile;
		expect(avatar.name).toBe("custom-name");
		expect(avatar.ext).toBe(".png");
	});

	it("should validate required field after processing all files", async () => {
		const file = createMockFile("avatar.png", 1024, "image/png");
		const ctx = createMockContext("multipart/form-data; boundary=boundary", {
			avatar: file,
			name: "John",
		});

		try {
			await handleUploads(ctx, {
				storage,
				fields: {
					avatar: {},
					cover: { required: true }, // required but not uploaded
				},
			});
			expect(true).toBe(false);
		} catch (e) {
			expect(e).toBeInstanceOf(BadRequestError);
			expect((e as BadRequestError).message).toContain("cover");
		}
	});
});

describe("MemoryStorage", () => {
	const storage = new MemoryStorage();

	it("should handle file and return UploadedFile with name and ext", async () => {
		const file = createMockFile("test.png", 1024, "image/png");
		const result = await storage.handleFile(file, "test-123", ".png");

		expect(result.originalName).toBe("test.png");
		expect(result.name).toBe("test-123");
		expect(result.ext).toBe(".png");
		expect(result.size).toBe(1024);
		expect(result.type).toBe("image/png");
		expect(result.buffer).toBeInstanceOf(ArrayBuffer);
		expect(result.path).toBeUndefined();
	});

	it("should return true on deleteFile", async () => {
		const result = await storage.deleteFile("any-path");
		expect(result).toBe(true);
	});
});

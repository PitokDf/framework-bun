import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { zValidator } from "../src/middlewares/validator";

function createMockFile(name: string, size: number, type: string): File {
	const buffer = new ArrayBuffer(size);
	const view = new Uint8Array(buffer);

	if (type === "image/png") {
		const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
		sig.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	} else if (type === "application/pdf") {
		const sig = [0x25, 0x50, 0x44, 0x46];
		sig.forEach((byte, i) => {
			if (i < view.length) view[i] = byte;
		});
	}

	return new File([buffer], name, { type });
}

function createMockCtx(form: FormData): any {
	const req = new Request("http://localhost/test", {
		method: "POST",
		headers: { "Content-Type": "multipart/form-data" },
		body: form,
	});

	let cachedFormData: FormData | null = null;

	return {
		request: req,
		formData: async () => {
			if (!cachedFormData) cachedFormData = form;
			return cachedFormData;
		},
		store: {} as Record<string, unknown>,
		validated: {} as Record<string, unknown>,
		setValidated(target: string, data: unknown) {
			this.validated[target] = data;
		},
		valid(target: string) {
			return this.validated[target];
		},
		error(message: string, status: number, details?: unknown) {
			return { success: false, message, status, details };
		},
		json(data: unknown, status = 200) {
			return Response.json(data, { status });
		},
	};
}

describe("zValidator multipart/form-data file handling", () => {
	it("should validate a single file with z.file()", async () => {
		const schema = z.object({ avatar: z.file() });
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file = createMockFile("photo.png", 1024, "image/png");
		const form = new FormData();
		form.append("avatar", file);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		// Should pass validation (return undefined means next() was called)
		expect(result).toBeUndefined();
		expect(ctx.validated.body).toBeDefined();
		expect((ctx.validated.body as any).avatar).toBeInstanceOf(File);
	});

	it("should validate z.array(z.file()) with multiple files", async () => {
		const schema = z.object({ photos: z.array(z.file()) });
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file1 = createMockFile("photo1.png", 1024, "image/png");
		const file2 = createMockFile("photo2.png", 2048, "image/png");
		const file3 = createMockFile("photo3.png", 512, "image/png");

		const form = new FormData();
		form.append("photos", file1);
		form.append("photos", file2);
		form.append("photos", file3);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeUndefined();
		const body = ctx.validated.body as { photos: File[] };
		expect(body.photos).toBeInstanceOf(Array);
		expect(body.photos).toHaveLength(3);
		expect(body.photos[0].name).toBe("photo1.png");
		expect(body.photos[1].name).toBe("photo2.png");
		expect(body.photos[2].name).toBe("photo3.png");
	});

	it("should validate z.array(z.file()) with single file (returns File, not array)", async () => {
		const schema = z.object({ docs: z.array(z.file()) });
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file = createMockFile("doc.pdf", 4096, "application/pdf");
		const form = new FormData();
		form.append("docs", file);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		// Single file → stored as File (not array). Use z.file() for single files.
		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should validate mixed text and file fields", async () => {
		const schema = z.object({
			title: z.string(),
			images: z.array(z.file()),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file1 = createMockFile("img1.png", 1024, "image/png");
		const file2 = createMockFile("img2.png", 2048, "image/png");

		const form = new FormData();
		form.append("title", "My Album");
		form.append("images", file1);
		form.append("images", file2);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeUndefined();
		const body = ctx.validated.body as { title: string; images: File[] };
		expect(body.title).toBe("My Album");
		expect(body.images).toHaveLength(2);
	});

	it("should fail validation when z.array(z.file()) receives no files", async () => {
		const schema = z.object({ photos: z.array(z.file()) });
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const form = new FormData();
		form.append("title", "No files");

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		// Should return error response
		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should fail validation when single file given to z.array(z.file()).min(2)", async () => {
		const schema = z.object({
			photos: z.array(z.file()).min(2),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file = createMockFile("only.png", 1024, "image/png");
		const form = new FormData();
		form.append("photos", file);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should validate z.array(z.file()) with optional file array", async () => {
		const schema = z.object({
			name: z.string(),
			attachments: z.array(z.file()).optional(),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const form = new FormData();
		form.append("name", "Report");

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeUndefined();
		const body = ctx.validated.body as {
			name: string;
			attachments?: File[];
		};
		expect(body.name).toBe("Report");
		expect(body.attachments).toBeUndefined();
	});

	it("should reject z.file() when MIME type does not match .mime() constraint", async () => {
		const schema = z.object({
			avatar: z.file().mime(["image/png", "image/jpeg"]),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file = createMockFile("doc.pdf", 4096, "application/pdf");
		const form = new FormData();
		form.append("avatar", file);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should reject z.file().max(n) when file exceeds size limit", async () => {
		const schema = z.object({
			avatar: z.file().max(512),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file = createMockFile("big.png", 2048, "image/png");
		const form = new FormData();
		form.append("avatar", file);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should reject z.array(z.file()).max(2) when too many files provided", async () => {
		const schema = z.object({
			photos: z.array(z.file()).max(2),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const file1 = createMockFile("a.png", 512, "image/png");
		const file2 = createMockFile("b.png", 512, "image/png");
		const file3 = createMockFile("c.png", 512, "image/png");

		const form = new FormData();
		form.append("photos", file1);
		form.append("photos", file2);
		form.append("photos", file3);

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should pass z.file() optional when no file is provided", async () => {
		const schema = z.object({
			name: z.string(),
			avatar: z.file().optional(),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const form = new FormData();
		form.append("name", "Alice");

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeUndefined();
		const body = ctx.validated.body as { name: string; avatar?: File };
		expect(body.name).toBe("Alice");
		expect(body.avatar).toBeUndefined();
	});

	it("should fail when required file field is missing", async () => {
		const schema = z.object({
			title: z.string(),
			document: z.file(),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		const form = new FormData();
		form.append("title", "My Doc");

		const ctx = createMockCtx(form);
		const result = await middleware(ctx, async () => {});

		expect(result).toBeDefined();
		expect((result as any).success).toBe(false);
	});

	it("should validate multiple constraints: z.file().mime().max()", async () => {
		const schema = z.object({
			avatar: z.file().mime(["image/png"]).max(1024),
		});
		const middleware = zValidator("body", schema, {
			contentType: "multipart/form-data",
		});

		// Correct type and size
		const goodFile = createMockFile("ok.png", 512, "image/png");
		const form1 = new FormData();
		form1.append("avatar", goodFile);
		const ctx1 = createMockCtx(form1);
		const result1 = await middleware(ctx1, async () => {});
		expect(result1).toBeUndefined();

		// Wrong MIME type
		const badMime = createMockFile("bad.pdf", 512, "application/pdf");
		const form2 = new FormData();
		form2.append("avatar", badMime);
		const ctx2 = createMockCtx(form2);
		const result2 = await middleware(ctx2, async () => {});
		expect(result2).toBeDefined();
		expect((result2 as any).success).toBe(false);

		// Oversized
		const bigFile = createMockFile("big.png", 4096, "image/png");
		const form3 = new FormData();
		form3.append("avatar", bigFile);
		const ctx3 = createMockCtx(form3);
		const result3 = await middleware(ctx3, async () => {});
		expect(result3).toBeDefined();
		expect((result3 as any).success).toBe(false);
	});
});

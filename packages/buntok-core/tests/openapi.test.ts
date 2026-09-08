import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { generateOpenApiDocument } from "../src/helpers/openapi";

describe("generateOpenApiDocument", () => {
	it("should return null for empty openApiDocs", () => {
		const result = generateOpenApiDocument({ openApiDocs: [] });
		expect(result).toBeNull();
	});

	it("should return null for undefined openApiDocs", () => {
		const result = generateOpenApiDocument({
			openApiDocs: undefined as unknown as any[],
		});
		expect(result).toBeNull();
	});

	it("should generate a basic OpenAPI document with one route", () => {
		const docs = [
			{
				method: "get",
				path: "/users",
				request: { params: null, query: null, body: null },
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });

		expect(result).not.toBeNull();
		const doc = result as any;
		expect(doc.openapi).toBe("3.0.0");
		expect(doc.info.title).toBe("Buntok API Documentation");
		expect(doc.info.version).toBe("1.0.0");
		expect(doc.paths["/users"]).toBeDefined();
		expect(doc.paths["/users"].get).toBeDefined();
	});

	it("should use custom title, version, and description", () => {
		const docs = [
			{
				method: "get",
				path: "/test",
				request: { params: null, query: null, body: null },
				responses: [],
			},
		];

		const result = generateOpenApiDocument({
			openApiDocs: docs,
			title: "My API",
			version: "2.0.0",
			description: "My custom API",
		});

		const doc = result as any;
		expect(doc.info.title).toBe("My API");
		expect(doc.info.version).toBe("2.0.0");
		expect(doc.info.description).toBe("My custom API");
	});

	it("should convert express-style params to OpenAPI format", () => {
		const docs = [
			{
				method: "get",
				path: "/users/:id",
				request: { params: z.object({ id: z.string() }), query: null, body: null },
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		// :id should become {id}
		expect(doc.paths["/users/{id}"]).toBeDefined();
		expect(doc.paths["/users/{id}"].get).toBeDefined();
	});

	it("should handle multiple params in path", () => {
		const docs = [
			{
				method: "get",
				path: "/users/:userId/posts/:postId",
				request: {
					params: z.object({ userId: z.string(), postId: z.string() }),
					query: null,
					body: null,
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users/{userId}/posts/{postId}"]).toBeDefined();
	});

	it("should include query parameters in the spec", () => {
		const docs = [
			{
				method: "get",
				path: "/users",
				request: {
					params: null,
					query: z.object({ page: z.number(), limit: z.number() }),
					body: null,
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users"].get.parameters).toBeDefined();
		expect(doc.paths["/users"].get.parameters.length).toBe(2);
	});

	it("should include request body in the spec", () => {
		const docs = [
			{
				method: "post",
				path: "/users",
				request: {
					params: null,
					query: null,
					body: z.object({ name: z.string(), email: z.string().email() }),
					bodyContentType: "application/json",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users"].post.requestBody).toBeDefined();
		expect(
			doc.paths["/users"].post.requestBody.content["application/json"],
		).toBeDefined();
	});

	it("should include response schemas", () => {
		const docs = [
			{
				method: "get",
				path: "/users/:id",
				request: { params: z.object({ id: z.string() }), query: null, body: null },
				responses: [
					{
						status: 200,
						description: "User found",
						schema: z.object({ id: z.string(), name: z.string() }),
					},
					{
						status: 404,
						description: "User not found",
						schema: z.object({ error: z.string() }),
					},
				],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const getOp = doc.paths["/users/{id}"].get;
		expect(getOp.responses["200"]).toBeDefined();
		expect(getOp.responses["200"].description).toBe("User found");
		expect(getOp.responses["404"]).toBeDefined();
		expect(getOp.responses["404"].description).toBe("User not found");
	});

	it("should add default 200 response when no responses defined", () => {
		const docs = [
			{
				method: "get",
				path: "/health",
				request: { params: null, query: null, body: null },
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/health"].get.responses["200"]).toBeDefined();
		expect(doc.paths["/health"].get.responses["200"].description).toBe(
			"Success",
		);
	});

	it("should handle multiple HTTP methods on same path", () => {
		const docs = [
			{
				method: "get",
				path: "/users",
				request: { params: null, query: null, body: null },
				responses: [],
			},
			{
				method: "post",
				path: "/users",
				request: {
					params: null,
					query: null,
					body: z.object({ name: z.string() }),
					bodyContentType: "application/json",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users"].get).toBeDefined();
		expect(doc.paths["/users"].post).toBeDefined();
	});

	it("should skip bad schemas gracefully without crashing", () => {
		const docs = [
			{
				method: "get",
				path: "/good",
				request: { params: null, query: null, body: null },
				responses: [],
			},
			{
				method: "post",
				path: "/bad",
				request: {
					params: null,
					query: null,
					body: { invalid: "schema" } as any, // invalid schema object
					bodyContentType: "application/json",
				},
				responses: [],
			},
			{
				method: "get",
				path: "/also-good",
				request: { params: null, query: null, body: null },
				responses: [],
			},
		];

		// Should not throw
		const result = generateOpenApiDocument({ openApiDocs: docs });
		expect(result).not.toBeNull();

		const doc = result as any;
		// Good routes should still be present
		expect(doc.paths["/good"]).toBeDefined();
		expect(doc.paths["/also-good"]).toBeDefined();
	});

	it("should handle array schemas in body", () => {
		const docs = [
			{
				method: "post",
				path: "/users/bulk",
				request: {
					params: null,
					query: null,
					body: z.array(z.object({ name: z.string() })),
					bodyContentType: "application/json",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users/bulk"].post.requestBody).toBeDefined();
	});

	it("should handle optional fields in schemas", () => {
		const docs = [
			{
				method: "put",
				path: "/users/:id",
				request: {
					params: z.object({ id: z.string() }),
					query: null,
					body: z.object({
						name: z.string(),
						email: z.string().email().optional(),
					}),
					bodyContentType: "application/json",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users/{id}"].put).toBeDefined();
		expect(doc.paths["/users/{id}"].put.requestBody).toBeDefined();
	});

	it("should handle nullable fields in schemas", () => {
		const docs = [
			{
				method: "get",
				path: "/users/:id",
				request: {
					params: z.object({ id: z.string() }),
					query: null,
					body: null,
				},
				responses: [
					{
						status: 200,
						description: "User",
						schema: z.object({
							id: z.string(),
							name: z.string(),
							avatar: z.string().nullable(),
						}),
					},
				],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(doc.paths["/users/{id}"].get).toBeDefined();
	});

	it("should handle custom content types", () => {
		const docs = [
			{
				method: "post",
				path: "/upload",
				request: {
					params: null,
					query: null,
					body: z.string().openapi({ format: "binary" }),
					bodyContentType: "application/octet-stream",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(
			doc.paths["/upload"].post.requestBody.content["application/octet-stream"],
		).toBeDefined();
	});

	it("should default content type to application/json when not specified", () => {
		const docs = [
			{
				method: "post",
				path: "/data",
				request: {
					params: null,
					query: null,
					body: z.object({ data: z.string() }),
					// no bodyContentType
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		expect(
			doc.paths["/data"].post.requestBody.content["application/json"],
		).toBeDefined();
	});

	it("should handle large number of routes without errors", () => {
		const docs = [];
		for (let i = 0; i < 100; i++) {
			docs.push({
				method: "get",
				path: `/route-${i}/:id`,
				request: {
					params: z.object({ id: z.string() }),
					query: null,
					body: null,
				},
				responses: [],
			});
		}

		const result = generateOpenApiDocument({ openApiDocs: docs });
		expect(result).not.toBeNull();

		const doc = result as any;
		expect(Object.keys(doc.paths).length).toBe(100);
	});

	it("should include MIME types in file field description", () => {
		const docs = [
			{
				method: "post",
				path: "/upload",
				request: {
					params: null,
					query: null,
					body: z.object({
						avatar: z.file().mime(["image/png", "image/jpeg"]),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/upload"].post.requestBody.content["multipart/form-data"]
				.schema.properties;
		expect(props.avatar.description).toContain("accept: image/png, image/jpeg");
		expect(props.avatar.format).toBe("binary");
	});

	it("should handle z.array(z.file()) with MIME types", () => {
		const docs = [
			{
				method: "post",
				path: "/upload-multi",
				request: {
					params: null,
					query: null,
					body: z.object({
						documents: z.array(z.file().mime(["application/pdf"])),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/upload-multi"].post.requestBody.content[
				"multipart/form-data"
			].schema.properties;
		expect(props.documents.type).toBe("array");
		expect(props.documents.items.format).toBe("binary");
		expect(props.documents.items.description).toContain("accept: application/pdf");
	});

	it("should handle plain z.file() without MIME types", () => {
		const docs = [
			{
				method: "post",
				path: "/upload-plain",
				request: {
					params: null,
					query: null,
					body: z.object({
						file: z.file(),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/upload-plain"].post.requestBody.content[
				"multipart/form-data"
			].schema.properties;
		expect(props.file.format).toBe("binary");
		expect(props.file.description).toBe("Binary file");
		expect(props.file.description).not.toContain("accept:");
	});

	it("should handle z.file().mime() inside z.array() inside z.optional()", () => {
		const docs = [
			{
				method: "post",
				path: "/upload-complex",
				request: {
					params: null,
					query: null,
					body: z.object({
						images: z.array(z.file().mime(["image/png"])).optional(),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/upload-complex"].post.requestBody.content[
				"multipart/form-data"
			].schema.properties;
		expect(props.images.type).toBe("array");
		expect(props.images.items.format).toBe("binary");
		expect(props.images.items.description).toContain("accept: image/png");
	});

	it("should handle z.file().mime() inside z.optional() wrapper", () => {
		const docs = [
			{
				method: "post",
				path: "/upload-optional",
				request: {
					params: null,
					query: null,
					body: z.object({
						cover: z.file().mime(["image/jpeg", "image/webp"]).optional(),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/upload-optional"].post.requestBody.content[
				"multipart/form-data"
			].schema.properties;
		expect(props.cover.format).toBe("binary");
		expect(props.cover.description).toContain("accept: image/jpeg, image/webp");
	});

	it("should handle mixed text and file fields in multipart schema", () => {
		const docs = [
			{
				method: "post",
				path: "/post",
				request: {
					params: null,
					query: null,
					body: z.object({
						title: z.string().min(1),
						content: z.string(),
						cover: z.file().mime(["image/png"]),
						attachments: z.array(z.file()).optional(),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/post"].post.requestBody.content["multipart/form-data"]
				.schema.properties;
		expect(props.title.type).toBe("string");
		expect(props.content.type).toBe("string");
		expect(props.cover.format).toBe("binary");
		expect(props.cover.description).toContain("accept: image/png");
		expect(props.attachments.type).toBe("array");
		expect(props.attachments.items.format).toBe("binary");
	});

	it("should handle z.file().mime() with multiple MIME types", () => {
		const docs = [
			{
				method: "post",
				path: "/multi-mime",
				request: {
					params: null,
					query: null,
					body: z.object({
						document: z
							.file()
							.mime(["application/pdf", "image/png", "image/jpeg"]),
					}),
					bodyContentType: "multipart/form-data",
				},
				responses: [],
			},
		];

		const result = generateOpenApiDocument({ openApiDocs: docs });
		const doc = result as any;

		const props =
			doc.paths["/multi-mime"].post.requestBody.content["multipart/form-data"]
				.schema.properties;
		expect(props.document.description).toContain(
			"accept: application/pdf, image/png, image/jpeg",
		);
	});
});

import {
	extendZodWithOpenApi,
	OpenAPIRegistry,
	OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * Recursively walk a Zod schema and replace any type that zod-to-openapi
 * cannot handle (e.g. ZodFile from Zod v4) with a safe fallback so that
 * docs generation never crashes on an unsupported schema node.
 */
// biome-ignore lint/suspicious/noExplicitAny: schema introspection requires any
function extractMimeTypes(schema: any): string[] | null {
	if (!schema || typeof schema !== "object") return null;
	const checks = schema._def?.checks;
	if (!Array.isArray(checks)) return null;
	for (const check of checks) {
		if (check?._zod?.def?.check === "mime_type" && check._zod.def.mime) {
			return check._zod.def.mime as string[];
		}
	}
	return null;
}

// biome-ignore lint/suspicious/noExplicitAny: schema introspection requires any
function sanitizeSchema(schema: any): any {
	if (!schema || typeof schema !== "object" || !schema._def) return schema;

	const typeName: string = schema._def?.typeName ?? schema._def?.type ?? "";

	// ZodFile (Zod v4) → OpenAPI string format:binary
	if (typeName === "ZodFile" || typeName === "file") {
		const mimes = extractMimeTypes(schema);
		const mimeStr = mimes?.length ? ` (accept: ${mimes.join(", ")})` : "";
		return z
			.string()
			.openapi({ format: "binary", description: `Binary file${mimeStr}` });
	}

	// For all other types, return as-is - zod-to-openapi handles them
	// Only recurse into containers we know how to handle safely
	if (typeName === "ZodObject" || typeName === "object") {
		const shape =
			typeof schema._def.shape === "function"
				? schema._def.shape()
				: (schema._def.shape ?? {});
		const newShape: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(shape)) {
			newShape[key] = sanitizeSchema(value);
		}
		return z.object(newShape as Record<string, z.ZodTypeAny>);
	}

	if (typeName === "ZodArray" || typeName === "array") {
		const element = schema._def?.element ?? schema._def?.type;
		return z.array(sanitizeSchema(element));
	}

	if (typeName === "ZodOptional" || typeName === "optional") {
		return sanitizeSchema(schema._def.innerType).optional();
	}
	if (typeName === "ZodNullable" || typeName === "nullable") {
		return sanitizeSchema(schema._def.innerType).nullable();
	}

	// Default: return original schema (don't reconstruct unknown types)
	return schema;
}

export interface GenerateDocsOptions {
	// biome-ignore lint/suspicious/noExplicitAny: OpenAPI doc entries are dynamically typed
	openApiDocs: any[];
	title?: string;
	version?: string;
	description?: string;
}

/**
 * Generate an OpenAPI document from collected route metadata.
 * Used by both `app.listen()` (background) and `buntok make:docs` (CLI).
 *
 * Returns the OpenAPI document object, or null if no docs could be generated.
 */
export function generateOpenApiDocument(
	options: GenerateDocsOptions,
): object | null {
	const { openApiDocs, title, version, description } = options;

	if (!openApiDocs || openApiDocs.length === 0) return null;

	const registry = new OpenAPIRegistry();

	for (const doc of openApiDocs) {
		// Convert express-style params /users/:id → OpenAPI /users/{id}
		const openapiPath = doc.path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

		// biome-ignore lint/suspicious/noExplicitAny: RouteConfig populated dynamically
		const routeConfig: any = {
			method: doc.method,
			path: openapiPath,
			responses: {},
		};

		if (doc.request.params || doc.request.query || doc.request.body) {
			routeConfig.request = {};
			if (doc.request.params)
				routeConfig.request.params = sanitizeSchema(doc.request.params);
			if (doc.request.query)
				routeConfig.request.query = sanitizeSchema(doc.request.query);
			if (doc.request.body) {
				const contentType = doc.request.bodyContentType || "application/json";
				routeConfig.request.body = {
					content: {
						[contentType]: { schema: sanitizeSchema(doc.request.body) },
					},
				};
			}
		}

		if (doc.responses.length > 0) {
			for (const res of doc.responses) {
				routeConfig.responses[res.status.toString()] = {
					description: res.description,
					content: {
						"application/json": { schema: sanitizeSchema(res.schema) },
					},
				};
			}
		} else {
			routeConfig.responses["200"] = { description: "Success" };
		}

		// Per-route error handling: one bad schema should not abort everything
		try {
			registry.registerPath(routeConfig);
		} catch {
			// Skip bad schema silently in background mode
		}
	}

	const generator = new OpenApiGeneratorV3(registry.definitions);
	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: version ?? "1.0.0",
			title: title ?? "Buntok API Documentation",
			description:
				description ?? "Auto-generated OpenAPI docs from Zod schemas",
		},
	});
}

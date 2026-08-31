/**
 * Central response normalizer - Elysia-style flexible return.
 *
 * Allows handlers to return string | number | boolean | object | array | null | void
 * in addition to Response, and automatically serializes to correct Response.
 *
 * - Response -> passthrough
 * - null/undefined/void -> 204 No Content
 * - string -> text/plain; charset=utf-8
 * - number/boolean/bigint -> text/plain via String(value)
 * - Blob/ArrayBuffer/Uint8Array/ReadableStream -> BodyInit passthrough
 * - object/array -> application/json via Response.json
 */

const TEXT_HEADERS: Record<string, string> = {
	"Content-Type": "text/plain; charset=utf-8",
};

export function toResponse(value: unknown): Response {
	if (value instanceof Response) return value;
	if (value === null || value === undefined) {
		return new Response(null, { status: 204 });
	}
	const t = typeof value;
	if (t === "string") {
		return new Response(value as string, { headers: TEXT_HEADERS });
	}
	if (t === "number" || t === "boolean" || t === "bigint") {
		return new Response(String(value), { headers: TEXT_HEADERS });
	}
	// Binary / stream bodies should not be JSON-stringified
	if (
		value instanceof Blob ||
		value instanceof ArrayBuffer ||
		value instanceof Uint8Array ||
		value instanceof ReadableStream
	) {
		// biome-ignore lint/suspicious/noExplicitAny: BodyInit union is DOM-specific
		return new Response(value as any);
	}
	// Array, plain object, etc. -> JSON
	return Response.json(value);
}

export function toResponseMaybeAsync(
	value: unknown,
): Response | Promise<Response> {
	if (value instanceof Promise) {
		return value.then(toResponse);
	}
	return toResponse(value);
}

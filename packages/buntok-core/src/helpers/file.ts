import type { Context } from "../context";

export interface ServeFileOptions {
	contentType?: string;
	cacheControl?: string;
}

/**
 * Detect MIME type from file extension.
 */
function detectMimeType(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase();
	const mimeTypes: Record<string, string> = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		webp: "image/webp",
		gif: "image/gif",
		svg: "image/svg+xml",
		pdf: "application/pdf",
		json: "application/json",
		txt: "text/plain",
		html: "text/html",
		css: "text/css",
		js: "application/javascript",
	};
	return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Serve a file from disk. If file doesn't exist, return the fallback response.
 *
 * @example
 * // Serve file or return 404
 * serveFileOrFallback(ctx, doc.file_path, () => ctx.json({ error: "Not found" }, 404));
 *
 * @example
 * // Serve avatar or return default SVG
 * serveFileOrFallback(ctx, user.avatar_path, () => {
 *   return new Response(generateInitialAvatar(user.name, user.id), {
 *     headers: { "Content-Type": "image/svg+xml" }
 *   });
 * });
 */
export async function serveFileOrFallback(
	ctx: Context,
	filePath: string,
	fallback: Response | (() => Response | Promise<Response>),
	options?: ServeFileOptions,
): Promise<Response> {
	const file = Bun.file(filePath);

	if (await file.exists()) {
		return new Response(file, {
			headers: {
				"Content-Type": options?.contentType ?? detectMimeType(filePath),
				"Cache-Control": options?.cacheControl ?? "public, max-age=86400",
			},
		});
	}

	return typeof fallback === "function" ? fallback() : fallback;
}

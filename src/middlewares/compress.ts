import type { Middleware } from "../app";

export interface CompressOptions {
	/**
	 * Minimum response body size (bytes) before compressing. Compressing
	 * tiny payloads wastes CPU for zero/negative gain, so this defaults to
	 * 1024 rather than compressing everything unconditionally.
	 */
	threshold?: number;
	/** Content-Type prefixes eligible for compression. */
	types?: string[];
}

const DEFAULT_TYPES = [
	"text/",
	"application/json",
	"application/javascript",
	"application/xml",
	"image/svg+xml",
];

const DEFAULT_OPTIONS: Required<CompressOptions> = {
	threshold: 1024,
	types: DEFAULT_TYPES,
};

/**
 * Compress response bodies with gzip or brotli, negotiated from the
 * request's `Accept-Encoding` header. Opt-in via `app.use(compress())` —
 * compression is real CPU work, so routes that don't need it (or that
 * already stream pre-compressed/binary content) shouldn't pay for it.
 *
 * Uses Bun's native `Bun.gzipSync` (Zig, not a JS gzip implementation) and
 * falls back to `node:zlib`'s brotli when the client prefers `br`.
 */
export function compress(options: CompressOptions = {}): Middleware {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return async (ctx, next) => {
		const result = await next();
		if (!(result instanceof Response) || !result.body) return result;

		if (result.headers.get("Content-Encoding")) return result;

		const contentType = result.headers.get("Content-Type") || "";
		const eligible = opts.types.some((t) => contentType.startsWith(t));
		if (!eligible) return result;

		const acceptEncoding = ctx.request.headers.get("Accept-Encoding") || "";
		const supportsBrotli = acceptEncoding.includes("br");
		const supportsGzip = acceptEncoding.includes("gzip");
		if (!supportsBrotli && !supportsGzip) return result;

		const buffer = new Uint8Array(await result.arrayBuffer());
		if (buffer.byteLength < opts.threshold) {
			return new Response(buffer, {
				status: result.status,
				statusText: result.statusText,
				headers: result.headers,
			});
		}

		let compressed: Uint8Array;
		let encoding: string;

		if (supportsBrotli) {
			const zlib = await import("node:zlib");
			compressed = zlib.brotliCompressSync(buffer);
			encoding = "br";
		} else {
			compressed = Bun.gzipSync(buffer);
			encoding = "gzip";
		}

		const headers = new Headers(result.headers);
		headers.set("Content-Encoding", encoding);
		headers.set("Vary", "Accept-Encoding");
		headers.delete("Content-Length");

		return new Response(compressed, {
			status: result.status,
			statusText: result.statusText,
			headers,
		});
	};
}

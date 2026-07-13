import type { Middleware } from "./app";
import type { Context } from "./context";

const textEncoder = new TextEncoder();

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64UrlDecode(str: string) {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	const pad = str.length % 4;
	if (pad) str += "=".repeat(4 - pad);
	return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/**
 * Zero-dependency, ultra-fast JWT implementation using WebCrypto API
 */
export class JwtService {
	constructor(private secret: string) {}

	async sign(
		payload: Record<string, unknown>,
		expiresInSeconds?: number,
	): Promise<string> {
		const header = base64UrlEncode(
			textEncoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
		);

		const exp = expiresInSeconds
			? Math.floor(Date.now() / 1000) + expiresInSeconds
			: undefined;
		const data = base64UrlEncode(
			textEncoder.encode(JSON.stringify({ ...payload, exp })),
		);

		const key = await crypto.subtle.importKey(
			"raw",
			textEncoder.encode(this.secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signature = await crypto.subtle.sign(
			"HMAC",
			key,
			textEncoder.encode(`${header}.${data}`),
		);
		return `${header}.${data}.${base64UrlEncode(signature)}`;
	}

	async verify<T = Record<string, unknown>>(token: string): Promise<T | null> {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		try {
			const key = await crypto.subtle.importKey(
				"raw",
				textEncoder.encode(this.secret),
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["verify"],
			);

			const signature = base64UrlDecode(parts[2]!);
			const valid = await crypto.subtle.verify(
				"HMAC",
				key,
				signature,
				textEncoder.encode(`${parts[0]}.${parts[1]}`),
			);

			if (!valid) return null;

			const payload = JSON.parse(
				new TextDecoder().decode(base64UrlDecode(parts[1]!)),
			);

			// Check expiration
			if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
				return null;
			}

			return payload as T;
		} catch (e) {
			return null;
		}
	}
}

/**
 * Middleware that extracts Bearer token, verifies it, and injects user payload into `ctx.user`.
 * Returns 401 if unauthorized.
 */
export function requireAuth(
	secret: string,
): Middleware<Record<string, unknown>> {
	const jwt = new JwtService(secret);

	return async (
		ctx: Context<Record<string, unknown>>,
		next: () => Promise<Response> | Response,
	) => {
		const authHeader = ctx.request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return ctx.json(
				{ error: "Unauthorized", message: "Missing or invalid Bearer token" },
				401,
			);
		}

		const token = authHeader.split(" ")[1]!;
		const user = await jwt.verify(token);

		if (!user) {
			return ctx.json(
				{ error: "Unauthorized", message: "Token is invalid or expired" },
				401,
			);
		}

		// Inject user into context (buntok style)
		// biome-ignore lint/suspicious/noExplicitAny: internal injection
		(ctx as any).user = user;

		return next();
	};
}

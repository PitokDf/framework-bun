export interface CookieOptions {
	/** Domain to set the cookie on */
	domain?: string;
	/** Expiration time in seconds */
	maxAge?: number;
	/** Absolute expiration date */
	expires?: Date;
	/** Cookie path (default: /) */
	path?: string;
	/** Secure flag (HTTPS only) */
	secure?: boolean;
	/** HttpOnly flag (not accessible via JavaScript) */
	httpOnly?: boolean;
	/** SameSite policy */
	sameSite?: "strict" | "lax" | "none";
	/** Cookie partition key (for partitioned cookies) */
	partitioned?: boolean;
}

/**
 * Parse cookies from Cookie header string
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
	const cookies: Record<string, string> = {};

	if (!cookieHeader) return cookies;

	const pairs = cookieHeader.split(";");

	for (const pair of pairs) {
		const [name, ...valueParts] = pair.split("=");
		if (name === undefined) continue;
		const trimmedName = name.trim();
		const value = valueParts.join("=").trim();

		if (trimmedName) {
			cookies[trimmedName] = decodeURIComponent(value);
		}
	}

	return cookies;
}

/**
 * Serialize a cookie to a string
 */
export function serializeCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
): string {
	let cookie = `${name}=${encodeURIComponent(value)}`;

	if (options.domain) {
		cookie += `; Domain=${options.domain}`;
	}

	if (options.maxAge !== undefined) {
		cookie += `; Max-Age=${options.maxAge}`;
	}

	if (options.expires) {
		cookie += `; Expires=${options.expires.toUTCString()}`;
	}

	cookie += `; Path=${options.path || "/"}`;

	if (options.secure) {
		cookie += "; Secure";
	}

	if (options.httpOnly) {
		cookie += "; HttpOnly";
	}

	if (options.sameSite) {
		cookie += `; SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`;
	}

	if (options.partitioned) {
		cookie += "; Partitioned";
	}

	return cookie;
}

/**
 * Get a cookie value from request
 */
export function getCookie(request: Request, name: string): string | undefined {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return undefined;

	const cookies = parseCookies(cookieHeader);
	return cookies[name];
}

/**
 * Get all cookies from request
 */
export function getCookies(request: Request): Record<string, string> {
	const cookieHeader = request.headers.get("Cookie");
	return parseCookies(cookieHeader || "");
}

/**
 * Set a cookie on Response
 */
export function setCookie(
	response: Response,
	name: string,
	value: string,
	options: CookieOptions = {},
): Response {
	const cookie = serializeCookie(name, value, options);

	// Clone response and add Set-Cookie header
	const newResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});

	newResponse.headers.append("Set-Cookie", cookie);
	return newResponse;
}

/**
 * Delete a cookie (set expired)
 */
export function deleteCookie(
	response: Response,
	name: string,
	options: Omit<CookieOptions, "maxAge" | "expires"> = {},
): Response {
	return setCookie(response, name, "", {
		...options,
		maxAge: 0,
		expires: new Date(0),
	});
}

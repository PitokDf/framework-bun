import { deleteCookie, getCookie, setCookie } from "../helpers/cookie";

// ─── Cookie Names ─────────────────────────────────────────────────────────────

const OAUTH_STATE_COOKIE = "__buntok_oauth_state";
const OAUTH_VERIFIER_COOKIE = "__buntok_oauth_verifier";

// ─── State Management ─────────────────────────────────────────────────────────

/**
 * Store OAuth state + PKCE code verifier in HttpOnly cookies
 */
export function storeOAuthState(
	response: Response,
	state: string,
	codeVerifier: string,
): Response {
	let res = setCookie(response, OAUTH_STATE_COOKIE, state, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 600, // 10 minutes
	});

	res = setCookie(res, OAUTH_VERIFIER_COOKIE, codeVerifier, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});

	return res;
}

/**
 * Verify OAuth state matches (prevents CSRF)
 */
export function verifyOAuthState(
	request: Request,
	expectedState: string,
): boolean {
	const storedState = getCookie(request, OAUTH_STATE_COOKIE);
	if (!storedState) return false;
	return storedState === expectedState;
}

/**
 * Get PKCE code verifier from cookie
 */
export function getCodeVerifier(request: Request): string | undefined {
	return getCookie(request, OAUTH_VERIFIER_COOKIE);
}

/**
 * Clear OAuth cookies (called automatically after callback)
 */
export function clearOAuthCookies(response: Response): Response {
	let res = deleteCookie(response, OAUTH_STATE_COOKIE, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
	});

	res = deleteCookie(res, OAUTH_VERIFIER_COOKIE, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
	});

	return res;
}

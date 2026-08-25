const PRIVATE_IP_REGEX =
	/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|localhost|::1|fc|fd)/i;

/**
 * Get the client IP address from a Request.
 * Checks X-Forwarded-For, X-Real-IP, then falls back to request.remoteAddress.
 */
export function getClientIP(request: Request): string {
	const xff = request.headers.get("x-forwarded-for");
	if (xff) {
		const first = xff.split(",")[0]?.trim();
		if (first) return first;
	}

	const xri = request.headers.get("x-real-ip");
	if (xri) return xri;

	// Bun exposes remoteAddress on the request
	// biome-ignore lint/suspicious/noExplicitAny: Bun-specific property
	const remote = (request as any).remoteAddress;
	if (remote) return remote;

	return "unknown";
}

/**
 * Check if an IP address is a private/reserved address.
 */
export function isPrivateIP(ip: string): boolean {
	return PRIVATE_IP_REGEX.test(ip);
}

interface UserAgentInfo {
	browser: string;
	os: string;
	device: string;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
	[/opr\//i, "Opera"],
	[/edg/i, "Edge"],
	[/chrome/i, "Chrome"],
	[/firefox/i, "Firefox"],
	[/safari/i, "Safari"],
	[/msie|trident/i, "IE"],
];

const OS_PATTERNS: [RegExp, string][] = [
	[/windows/i, "Windows"],
	[/mac os/i, "macOS"],
	[/linux/i, "Linux"],
	[/android/i, "Android"],
	[/iphone|ipad|ipod/i, "iOS"],
	[/cros/i, "Chrome OS"],
	[/winphone/i, "Windows Phone"],
];

const DEVICE_PATTERNS: [RegExp, string][] = [
	[/mobile|android.*mobile|iphone/i, "Mobile"],
	[/ipad|tablet|android(?!.*mobile)/i, "Tablet"],
];

/**
 * Parse the User-Agent header into a simple `{ browser, os, device }` object.
 */
export function parseUserAgent(request: Request): UserAgentInfo {
	const ua = request.headers.get("user-agent") ?? "";

	let browser = "Other";
	for (const [pattern, name] of BROWSER_PATTERNS) {
		if (pattern.test(ua)) {
			browser = name;
			break;
		}
	}

	let os = "Other";
	for (const [pattern, name] of OS_PATTERNS) {
		if (pattern.test(ua)) {
			os = name;
			break;
		}
	}

	let device = "Desktop";
	for (const [pattern, name] of DEVICE_PATTERNS) {
		if (pattern.test(ua)) {
			device = name;
			break;
		}
	}

	return { browser, os, device };
}

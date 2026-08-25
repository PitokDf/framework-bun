// ─── PKCE Helpers (RFC 7636) ───────────────────────────────────────────────────
// Uses Web Crypto API (built-in Bun/Node 18+)

const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * Generate a cryptographically random code verifier (RFC 7636 §4.1)
 * Length: 43-128 characters, using unreserved characters only
 */
export function generateCodeVerifier(length: number = 43): string {
  if (length < 43 || length > 128) {
    throw new RangeError("Code verifier length must be between 43 and 128");
  }

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let verifier = "";
  for (let i = 0; i < length; i++) {
    verifier += CHARSET[bytes[i]! % CHARSET.length];
  }
  return verifier;
}

/**
 * Compute S256 code challenge from a code verifier (RFC 7636 §4.2)
 * code_challenge = BASE64URL(SHA256(code_verifier))
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate PKCE code verifier + challenge pair
 */
export async function generatePKCE(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

// ─── Base64URL Encoding ───────────────────────────────────────────────────────

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

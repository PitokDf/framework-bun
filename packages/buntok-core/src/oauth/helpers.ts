import type {
  CreateAuthorizationURLOptions,
  ValidateAuthorizationCodeOptions,
  OAuth2Tokens,
} from "./types";
import { OAuthProviderError } from "./types";

// ─── Create Authorization URL ─────────────────────────────────────────────────

/**
 * Create an OAuth2 authorization URL for any provider
 */
export function createOAuth2AuthorizationURL(
  authorizationEndpoint: string,
  options: CreateAuthorizationURLOptions,
): string {
  const url = new URL(authorizationEndpoint);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectURI);
  url.searchParams.set("state", options.state);

  if (options.scopes?.length) {
    url.searchParams.set("scope", options.scopes.join(" "));
  }

  if (options.codeChallenge) {
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (options.additionalParams) {
    for (const [key, value] of Object.entries(options.additionalParams)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

// ─── Validate Authorization Code ──────────────────────────────────────────────

/**
 * Validate an OAuth2 authorization code with any provider's token endpoint
 */
export async function validateOAuth2AuthorizationCode(
  options: ValidateAuthorizationCodeOptions,
): Promise<OAuth2Tokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectURI,
    client_id: options.clientId,
    client_secret: options.clientSecret,
  });

  if (options.codeVerifier) {
    body.set("code_verifier", options.codeVerifier);
  }

  const response = await fetch(options.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new OAuthProviderError(
      `Token exchange failed: ${data.error_description || data.error || "Unknown error"}`,
      "unknown",
      data.error as string,
      data.error_description as string,
    );
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    idToken: data.id_token as string | undefined,
    expiresAt: data.expires_in
      ? Date.now() + (data.expires_in as number) * 1000
      : undefined,
    tokenType: data.token_type as string | undefined,
    scope: data.scope as string | undefined,
  };
}

// ─── Decode ID Token (JWT) ────────────────────────────────────────────────────

/**
 * Decode an ID token (JWT) without verification.
 * For production, verify the signature using the provider's public keys.
 */
export function decodeIdToken(idToken: string): Record<string, unknown> {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = parts[1]!;
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as Record<string, unknown>;
}

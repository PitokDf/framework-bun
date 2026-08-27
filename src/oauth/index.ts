// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Generic Helpers ──────────────────────────────────────────────────────────
export {
	createOAuth2AuthorizationURL,
	decodeIdToken,
	validateOAuth2AuthorizationCode,
} from "./helpers";
// ─── PKCE ─────────────────────────────────────────────────────────────────────
export {
	generateCodeChallenge,
	generateCodeVerifier,
	generatePKCE,
} from "./pkce";
// ─── Base Provider ────────────────────────────────────────────────────────────
export { BaseOAuthProvider } from "./provider";
export { AppleProvider, type AppleUser } from "./providers/apple";
export { GitHubProvider, type GitHubUser } from "./providers/github";
// ─── Built-in Providers ───────────────────────────────────────────────────────
export { GoogleProvider, type GoogleUser } from "./providers/google";
// ─── State Management ─────────────────────────────────────────────────────────
export {
	clearOAuthCookies,
	getCodeVerifier,
	storeOAuthState,
	verifyOAuthState,
} from "./state";
export type {
	AppleProviderConfig,
	CreateAuthorizationURLOptions,
	OAuth2Tokens,
	OAuthProvider,
	OAuthProviderConfig,
	OAuthUser,
	ValidateAuthorizationCodeOptions,
} from "./types";
export {
	OAuthError,
	OAuthProviderError,
	OAuthStateError,
	OAuthTokenError,
} from "./types";

import { AppleProvider } from "./providers/apple";
import { GitHubProvider } from "./providers/github";
import { GoogleProvider } from "./providers/google";
// ─── Convenience Factory ──────────────────────────────────────────────────────
import type { AppleProviderConfig, OAuthProviderConfig } from "./types";

/**
 * Create OAuth providers with a simple factory API
 *
 * @example
 * ```ts
 * import { createOAuth } from "@buntok/core";
 *
 * const google = createOAuth.google({
 *   clientId: process.env.GOOGLE_CLIENT_ID!,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 *   redirectURI: "http://localhost:1212/auth/google/callback",
 * });
 * ```
 */
export const createOAuth = {
	google: (config: OAuthProviderConfig) => new GoogleProvider(config),
	github: (config: OAuthProviderConfig) => new GitHubProvider(config),
	apple: (config: AppleProviderConfig) => new AppleProvider(config),
};

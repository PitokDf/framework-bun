import { createOAuth2AuthorizationURL, decodeIdToken } from "../helpers";
import { BaseOAuthProvider } from "../provider";
import type { OAuth2Tokens, OAuthProviderConfig, OAuthUser } from "../types";
import { OAuthProviderError, OAuthTokenError } from "../types";

// ─── Google OAuth2 / OIDC ─────────────────────────────────────────────────────
// Docs: https://developers.google.com/identity/openid-connect/openid-connect

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";
const ISSUER = "https://accounts.google.com";

export interface GoogleUser extends OAuthUser {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	email?: string;
	email_verified?: boolean;
	locale?: string;
}

export class GoogleProvider extends BaseOAuthProvider {
	readonly id = "google";

	constructor(config: OAuthProviderConfig) {
		super({
			...config,
			scopes: config.scopes ?? ["openid", "email", "profile"],
		});
	}

	createAuthorizationURL(state: string, codeVerifier: string): string {
		return createOAuth2AuthorizationURL(AUTHORIZATION_ENDPOINT, {
			clientId: this.config.clientId,
			redirectURI: this.config.redirectURI,
			scopes: this.config.scopes,
			state,
			codeChallenge: codeVerifier,
		});
	}

	async validateAuthorizationCode(
		code: string,
		redirectURI: string,
		codeVerifier?: string,
	): Promise<OAuth2Tokens> {
		const body = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectURI,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
		});

		if (codeVerifier) {
			body.set("code_verifier", codeVerifier);
		}

		const response = await fetch(TOKEN_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: body.toString(),
		});

		const data = (await response.json()) as Record<string, unknown>;

		if (!response.ok) {
			throw new OAuthTokenError(
				`Google token exchange failed: ${data.error_description || data.error || "Unknown error"}`,
				this.id,
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

	async getUserInfo(tokens: OAuth2Tokens): Promise<GoogleUser> {
		// Try to decode ID token first (OIDC — no extra API call needed)
		if (tokens.idToken) {
			const claims = decodeIdToken(tokens.idToken);

			// Verify issuer
			if (claims.iss !== ISSUER && claims.iss !== "accounts.google.com") {
				throw new OAuthProviderError(
					"Invalid Google ID token issuer",
					this.id,
					"invalid_issuer",
				);
			}

			return {
				id: claims.sub as string,
				sub: claims.sub as string,
				name: claims.name as string | undefined,
				given_name: claims.given_name as string | undefined,
				family_name: claims.family_name as string | undefined,
				picture: claims.picture as string | undefined,
				email: claims.email as string | undefined,
				emailVerified: claims.email_verified as boolean | undefined,
				locale: claims.locale as string | undefined,
			};
		}

		// Fallback to userinfo endpoint
		const response = await fetch(USERINFO_ENDPOINT, {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`,
			},
		});

		if (!response.ok) {
			throw new OAuthTokenError(
				`Failed to fetch Google user info: ${response.status}`,
				this.id,
			);
		}

		const data = (await response.json()) as Record<string, unknown>;

		return {
			id: data.sub as string,
			sub: data.sub as string,
			name: data.name as string | undefined,
			given_name: data.given_name as string | undefined,
			family_name: data.family_name as string | undefined,
			picture: data.picture as string | undefined,
			email: data.email as string | undefined,
			emailVerified: data.email_verified as boolean | undefined,
			locale: data.locale as string | undefined,
		};
	}
}

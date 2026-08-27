// ─── Token Types ──────────────────────────────────────────────────────────────

export interface OAuth2Tokens {
	accessToken: string;
	refreshToken?: string;
	idToken?: string;
	expiresAt?: number;
	tokenType?: string;
	scope?: string;
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface OAuthUser {
	id: string;
	name?: string;
	email?: string;
	emailVerified?: boolean;
	image?: string;
	[key: string]: unknown;
}

// ─── Provider Config ──────────────────────────────────────────────────────────

export interface OAuthProviderConfig {
	clientId: string;
	clientSecret: string;
	redirectURI: string;
	scopes?: string[];
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface OAuthProvider {
	readonly id: string;
	createAuthorizationURL(state: string, codeVerifier: string): string;
	validateAuthorizationCode(
		code: string,
		redirectURI: string,
		codeVerifier?: string,
	): Promise<OAuth2Tokens>;
	getUserInfo(tokens: OAuth2Tokens): Promise<OAuthUser>;
}

// ─── Generic OAuth Helpers ────────────────────────────────────────────────────

export interface CreateAuthorizationURLOptions {
	clientId: string;
	redirectURI: string;
	scopes?: string[];
	state: string;
	codeChallenge?: string;
	additionalParams?: Record<string, string>;
}

export interface ValidateAuthorizationCodeOptions {
	code: string;
	redirectURI: string;
	clientId: string;
	clientSecret: string;
	codeVerifier?: string;
	tokenEndpoint: string;
}

// ─── Apple-Specific Types ─────────────────────────────────────────────────────

export interface AppleProviderConfig extends OAuthProviderConfig {
	teamId: string;
	keyId: string;
	privateKey: string;
}

// ─── Error Classes ────────────────────────────────────────────────────────────

export class OAuthError extends Error {
	public readonly code: string;
	public readonly provider: string;

	constructor(message: string, code: string, provider: string) {
		super(message);
		this.name = "OAuthError";
		this.code = code;
		this.provider = provider;
	}
}

export class OAuthStateError extends OAuthError {
	constructor(provider: string) {
		super(
			"OAuth state mismatch — possible CSRF attack",
			"STATE_MISMATCH",
			provider,
		);
		this.name = "OAuthStateError";
	}
}

export class OAuthTokenError extends OAuthError {
	constructor(message: string, provider: string) {
		super(message, "TOKEN_ERROR", provider);
		this.name = "OAuthTokenError";
	}
}

export class OAuthProviderError extends OAuthError {
	public readonly providerError?: string;
	public readonly providerErrorDescription?: string;

	constructor(
		message: string,
		provider: string,
		providerError?: string,
		providerErrorDescription?: string,
	) {
		super(message, "PROVIDER_ERROR", provider);
		this.name = "OAuthProviderError";
		this.providerError = providerError;
		this.providerErrorDescription = providerErrorDescription;
	}
}

import { BaseOAuthProvider } from "../provider";
import { OAuthTokenError } from "../types";
import { createOAuth2AuthorizationURL } from "../helpers";
import type {
  OAuthProviderConfig,
  OAuth2Tokens,
  OAuthUser,
} from "../types";

// ─── GitHub OAuth2 ────────────────────────────────────────────────────────────
// Docs: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

const AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize";
const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const API_BASE = "https://api.github.com";

export interface GitHubUser extends OAuthUser {
  login: string;
  avatar_url?: string;
  html_url?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
}

export class GitHubProvider extends BaseOAuthProvider {
  readonly id = "github";

  constructor(config: OAuthProviderConfig) {
    super({
      ...config,
      scopes: config.scopes ?? ["user:email"],
    });
  }

  createAuthorizationURL(state: string, _codeVerifier: string): string {
    // GitHub doesn't support PKCE (as of 2026)
    return createOAuth2AuthorizationURL(AUTHORIZATION_ENDPOINT, {
      clientId: this.config.clientId,
      redirectURI: this.config.redirectURI,
      scopes: this.config.scopes,
      state,
    });
  }

  async validateAuthorizationCode(
    code: string,
    _redirectURI: string,
    _codeVerifier?: string,
  ): Promise<OAuth2Tokens> {
    // GitHub uses HTTP Basic Auth for token exchange
    const credentials = btoa(
      `${this.config.clientId}:${this.config.clientSecret}`,
    );

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new OAuthTokenError(
        `GitHub token exchange failed: ${data.error_description || data.error || "Unknown error"}`,
        this.id,
      );
    }

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      tokenType: data.token_type as string | undefined,
      scope: data.scope as string | undefined,
    };
  }

  async getUserInfo(tokens: OAuth2Tokens): Promise<GitHubUser> {
    // Fetch user profile
    const userResponse = await fetch(`${API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userResponse.ok) {
      throw new OAuthTokenError(
        `Failed to fetch GitHub user: ${userResponse.status}`,
        this.id,
      );
    }

    const userData = (await userResponse.json()) as Record<string, unknown>;

    // Fetch user emails (email may be private)
    const emailsResponse = await fetch(`${API_BASE}/user/emails`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    let primaryEmail: string | undefined;
    let emailVerified = false;

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primary = emails.find((e) => e.primary);
      if (primary) {
        primaryEmail = primary.email;
        emailVerified = primary.verified;
      }
    }

    return {
      id: String(userData.id),
      name: (userData.name as string) || (userData.login as string),
      email: primaryEmail,
      emailVerified,
      image: userData.avatar_url as string | undefined,
      login: userData.login as string,
      avatar_url: userData.avatar_url as string | undefined,
      html_url: userData.html_url as string | undefined,
      bio: userData.bio as string | undefined,
      company: userData.company as string | undefined,
      location: userData.location as string | undefined,
      blog: userData.blog as string | undefined,
    };
  }
}

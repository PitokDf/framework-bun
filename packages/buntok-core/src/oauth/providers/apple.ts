import { BaseOAuthProvider } from "../provider";
import { OAuthTokenError, OAuthProviderError } from "../types";
import { createOAuth2AuthorizationURL, decodeIdToken } from "../helpers";
import { generateCodeChallenge } from "../pkce";
import type {
  AppleProviderConfig,
  OAuth2Tokens,
  OAuthUser,
} from "../types";

// ─── Apple OIDC ───────────────────────────────────────────────────────────────
// Docs: https://developer.apple.com/documentation/sign-in-with-apple
// NOTE: Apple only sends name on FIRST authentication. Store it if you get it.

const AUTHORIZATION_ENDPOINT = "https://appleid.apple.com/auth/authorize";
const TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";
const ISSUER = "https://appleid.apple.com";

export interface AppleUser extends OAuthUser {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  // Apple only sends these ONCE (first auth)
  /** Raw Apple name object — only available on first authentication */
  appleName?: {
    firstName?: string;
    lastName?: string;
  };
}

// ─── JWT Helpers (for Apple client_secret) ─────────────────────────────────────

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(privateKey: string): Promise<CryptoKey> {
  // Clean the key
  const cleaned = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function signJWT(
  payload: Record<string, unknown>,
  privateKey: string,
  keyId: string,
): Promise<string> {
  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(signingInput),
  );

  // Convert DER signature to raw R||S format
  const der = new Uint8Array(signature);
  // DER: 0x30 [total] 0x02 [rLen] [r...] 0x02 [sLen] [s...]
  const rLen = der[3]!;
  const r = der.slice(4, 4 + rLen);
  const sLen = der[5 + rLen]!;
  const s = der.slice(6 + rLen, 6 + rLen + sLen);

  // Pad R and S to 32 bytes each
  const rPadded = new Uint8Array(32);
  const sPadded = new Uint8Array(32);
  rPadded.set(r.slice(-32), 32 - Math.min(r.length, 32));
  sPadded.set(s.slice(-32), 32 - Math.min(s.length, 32));

  // Concatenate R || S
  const rawSignature = new Uint8Array(64);
  rawSignature.set(rPadded, 0);
  rawSignature.set(sPadded, 32);

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...rawSignature),
  );

  return `${signingInput}.${encodedSignature}`;
}

// ─── Apple Provider ───────────────────────────────────────────────────────────

export class AppleProvider extends BaseOAuthProvider {
  readonly id = "apple";

  private teamId: string;
  private keyId: string;
  private privateKey: string;

  constructor(config: AppleProviderConfig) {
    super({
      ...config,
      scopes: config.scopes ?? ["name", "email"],
    });
    this.teamId = config.teamId;
    this.keyId = config.keyId;
    this.privateKey = config.privateKey;
  }

  /**
   * Generate client_secret JWT (required by Apple)
   */
  private async generateClientSecret(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return signJWT(
      {
        iss: this.teamId,
        iat: now,
        exp: now + 15777000, // 6 months (Apple max)
        aud: ISSUER,
        sub: this.config.clientId,
      },
      this.privateKey,
      this.keyId,
    );
  }

  async createAuthorizationURL(state: string, codeVerifier: string): Promise<string> {
    // Apple uses a space-separated scope (not comma)
    const scopes = this.config.scopes?.join(" ") ?? "name email";
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    return createOAuth2AuthorizationURL(AUTHORIZATION_ENDPOINT, {
      clientId: this.config.clientId,
      redirectURI: this.config.redirectURI,
      scopes: [scopes],
      state,
      codeChallenge,
      additionalParams: {
        response_mode: "form_post",
      },
    });
  }

  async validateAuthorizationCode(
    code: string,
    redirectURI: string,
    codeVerifier?: string,
  ): Promise<OAuth2Tokens> {
    const clientSecret = await this.generateClientSecret();

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectURI,
      client_id: this.config.clientId,
      client_secret: clientSecret,
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
        `Apple token exchange failed: ${data.error_description || data.error || "Unknown error"}`,
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

  async getUserInfo(tokens: OAuth2Tokens): Promise<AppleUser> {
    if (!tokens.idToken) {
      throw new OAuthProviderError(
        "Apple did not return an ID token",
        this.id,
        "no_id_token",
      );
    }

    const claims = decodeIdToken(tokens.idToken);

    // Verify issuer
    if (claims.iss !== ISSUER) {
      throw new OAuthProviderError(
        "Invalid Apple ID token issuer",
        this.id,
        "invalid_issuer",
      );
    }

    // Verify audience
    if (claims.aud !== this.config.clientId) {
      throw new OAuthProviderError(
        "Invalid Apple ID token audience",
        this.id,
        "invalid_audience",
      );
    }

    return {
      id: claims.sub as string,
      sub: claims.sub as string,
      email: claims.email as string | undefined,
      emailVerified: claims.email_verified as boolean | undefined,
      // Apple only sends name on FIRST auth — may be undefined
      appleName: claims.name as AppleUser["appleName"],
    };
  }
}

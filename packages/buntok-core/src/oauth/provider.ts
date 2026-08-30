import type {
  OAuthProvider,
  OAuthProviderConfig,
  OAuth2Tokens,
  OAuthUser,
} from "./types";

/**
 * Base class for OAuth providers.
 * Extend this to implement custom providers.
 */
export abstract class BaseOAuthProvider implements OAuthProvider {
  abstract readonly id: string;

  protected config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  abstract createAuthorizationURL(
    state: string,
    codeVerifier: string,
  ): Promise<string> | string;

  abstract validateAuthorizationCode(
    code: string,
    redirectURI: string,
    codeVerifier?: string,
  ): Promise<OAuth2Tokens>;

  abstract getUserInfo(tokens: OAuth2Tokens): Promise<OAuthUser>;
}

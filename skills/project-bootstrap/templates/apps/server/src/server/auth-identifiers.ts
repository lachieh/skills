/**
 * The authorization server's identifiers: its origin, issuer, JWKS URL, the
 * `/mcp` protected-resource identifier, and the scopes it grants. A leaf with
 * no Better Auth dependency, so the OAuth provisioning `createBetterAuth` runs,
 * the MCP and operator doors, and the device-flow commands can all name them
 * without importing the auth instance (and without an import cycle through it).
 */

// The RFC 9728 protected-resource identifier the MCP door answers as.
export const mcpResourcePath = '/mcp';

// Better Auth serves under this base path when no other is configured; the
// resolved issuer and JWKS URL hang off it.
const betterAuthBasePath = '/api/auth';

// Scopes the authorization server advertises and accepts. The MCP resource
// scopes ride alongside the standard identity scopes; `offline_access` keeps
// device-flow clients refreshable.
export const oauthScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'mcp',
  'mcp:write',
  'cli:read',
  'cli:write',
  'cli:deploy',
];

export type AuthEnvironment = {
  readonly APP_URL?: string;
  readonly BETTER_AUTH_URL?: string;
  readonly BETTER_AUTH_SECRET?: string;
  readonly NODE_ENV?: string;
};

/**
 * The origin Better Auth is anchored to: an explicit base URL, the APP_URL
 * environment variable (the deployment convention), the BETTER_AUTH_URL
 * alias, or the development default. Shared by the auth instance and the MCP
 * resource server so both derive the same issuer, JWKS, and
 * protected-resource identifiers.
 */
export function resolveBetterAuthOrigin(
  explicitBaseURL?: string,
  environment: AuthEnvironment = {},
): string {
  const origin =
    explicitBaseURL ??
    environment.APP_URL ??
    environment.BETTER_AUTH_URL ??
    'http://localhost:3000';
  return origin.replace(/\/+$/, '');
}

/** The token issuer Better Auth's jwt plugin stamps into access tokens. */
export function betterAuthIssuerURL(origin = resolveBetterAuthOrigin()): string {
  return `${origin}${betterAuthBasePath}`;
}

/** The JWKS URL the MCP transport verifies access tokens against. */
export function betterAuthJwksURL(origin = resolveBetterAuthOrigin()): string {
  return `${betterAuthIssuerURL(origin)}/jwks`;
}

/** The RFC 8707 protected-resource identifier for the `/mcp` door. */
export function mcpResourceIdentifier(origin = resolveBetterAuthOrigin()): string {
  return new URL(mcpResourcePath, origin).toString();
}

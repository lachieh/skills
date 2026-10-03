import { mcp } from '@better-auth/mcp';
import { oauthDeviceAuthorization } from '@better-auth/oauth-provider';
import type { DatabaseClient } from '<scope>/db';
import {
  account,
  deviceCode,
  jwks,
  oauthAccessToken,
  oauthClient,
  oauthClientAssertion,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
  session,
  user,
  verification,
} from '<scope>/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, username } from 'better-auth/plugins';

import {
  mcpResourcePath,
  oauthScopes,
  resolveBetterAuthOrigin,
  type AuthEnvironment,
} from './auth-identifiers';
import { ensureMcpOAuthProvisioning } from './oauth-provisioning';

// The OAuth device-flow login lands on the sign-in page; MCP clients are
// redirected there to approve a device code.
export const betterAuthLoginPage = '/sign-in';

// The headers Better Auth's rate limiter reads the client address from, in
// priority order. The deployment's reverse proxy must set at least one of
// them; without a trustworthy client address Better Auth falls back to a single
// shared per-path bucket, which throttles every caller together. See
// request-session.ts, which forwards exactly these from the browser request.
export const authClientIpHeaderNames = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
] as const;

export type BetterAuthOptionsInput = {
  database: DatabaseClient;
  baseURL?: string;
  secret?: string;
  environment?: AuthEnvironment;
  rateLimit?: boolean;
};

/**
 * Builds the Better Auth instance: the authentication foundation for accounts
 * and, through the jwt + mcp plugins, the RFC 9728 authorization server the MCP
 * door and the operator API defer to.
 */
export function createBetterAuth({
  database,
  baseURL,
  secret,
  environment = {},
  rateLimit = true,
}: BetterAuthOptionsInput) {
  const resolvedBaseURL = resolveBetterAuthOrigin(baseURL, environment);
  const resolvedSecret = secret ?? environment.BETTER_AUTH_SECRET;
  if (environment.NODE_ENV === 'production' && !resolvedSecret) {
    throw new Error('BETTER_AUTH_SECRET is required in production.');
  }

  // The oauth-provider device grant only issues tokens for clients and
  // resources it knows; register this deployment's /mcp resource and its
  // managed public clients before the instance is used.
  ensureMcpOAuthProvisioning(database, resolvedBaseURL);

  return betterAuth({
    baseURL: resolvedBaseURL,
    secret: resolvedSecret ?? '<cookie>-development-secret',
    database: drizzleAdapter(database, {
      provider: 'sqlite',
      schema: {
        user,
        session,
        account,
        verification,
        jwks,
        deviceCode,
        oauthClient,
        oauthResource,
        oauthClientResource,
        oauthRefreshToken,
        oauthAccessToken,
        oauthConsent,
        oauthClientAssertion,
      },
    }),
    emailAndPassword: { enabled: true },
    // Better Auth's limiter is the site's only credential-attempt bound, and
    // its `/sign-in/*` rule (3 attempts per 10 seconds per client address) is
    // what throttles the site sign-in form. It defaults to production-only, so
    // it is enabled here for every environment: an unthrottled development or
    // test run is still an unthrottled one.
    rateLimit: { enabled: rateLimit },
    advanced: {
      // One cookie namespace for Better Auth; the site request adapter reads
      // and writes the same cookies through Better Auth.
      cookiePrefix: '<cookie>',
      ipAddress: {
        ipAddressHeaders: [...authClientIpHeaderNames],
      },
    },
    plugins: [
      // Username sign-in; Better Auth stores the credential on the linked
      // account row. Swap for the sign-in methods the project needs.
      username(),
      // JWT issuance and JWKS: MCP access tokens are verified JWTs.
      jwt(),
      // OAuth 2.0 Device Authorization Grant for headless MCP clients. The
      // oauth-provider variant owns the device grant at `/oauth2/token`: the
      // device code records the approved RFC 8707 resource indicators and the
      // managed OAuth client, and token issuance is audience-bound to them —
      // the resource-bound JWTs the /mcp transport requires. (The first-party
      // `/device/token` route issues audience-less opaque tokens the
      // transport correctly rejects, so it is not used.)
      oauthDeviceAuthorization(),
      mcp({
        loginPage: betterAuthLoginPage,
        // Managed clients skip consent, so the sign-in page accepts the redirect.
        // Point this at a consent page when third-party clients may register.
        consentPage: betterAuthLoginPage,
        resource: new URL(mcpResourcePath, resolvedBaseURL).toString(),
        // The authorization server only grants scopes it knows: the read and
        // write scopes the /mcp transport enforces ride on the standard set.
        scopes: oauthScopes,
      }),
    ],
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;

import { createServer, type Server } from 'node:http';

import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from 'jose';

/**
 * Test double of the Better Auth authorization server surface the MCP
 * transport depends on: a JWKS endpoint plus a signer that mints access
 * tokens bound to the `/mcp` resource with the requested scopes.
 */
export type McpTokenTestHarness = {
  /** Expected token issuer (a Better Auth base URL including its base path). */
  issuer: string;
  /** The protected resource identifier tokens are audience-bound to. */
  resource: string;
  /** The JWKS URL the transport verifies tokens against. */
  jwksUrl: string;
  /** Mints one signed access token with the given claims. */
  mintToken(claims?: {
    subject?: string;
    clientId?: string;
    scopes?: string[];
    /** Token lifetime in seconds; negative values mint expired tokens. */
    expiresIn?: number;
    issuer?: string;
    audience?: string;
    now?: number;
  }): Promise<string>;
  /** Shuts the JWKS server down. */
  close(): Promise<void>;
};

const SIGNING_ALGORITHM = 'ES256';
const KEY_ID = 'mcp-test-key';

export async function createMcpTokenTestHarness(
  overrides: {
    origin?: string;
    issuer?: string;
    resource?: string;
  } = {},
): Promise<McpTokenTestHarness> {
  const { privateKey, publicKey } = await generateKeyPair(SIGNING_ALGORITHM, {
    extractable: true,
  });
  const publicJwk = await exportJWK(publicKey);
  const jwks = { keys: [{ ...publicJwk, kid: KEY_ID, alg: SIGNING_ALGORITHM, use: 'sig' }] };

  const server: Server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(jwks));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('the JWKS test server failed to bind a port');
  }
  const origin = overrides.origin ?? `http://127.0.0.1:${address.port}`;

  const issuer = overrides.issuer ?? `${origin}/api/auth`;
  const resource = overrides.resource ?? `${origin}/mcp`;

  return {
    issuer,
    resource,
    jwksUrl: `${origin}/jwks`,
    async mintToken(claims = {}) {
      const now = claims.now ?? Math.floor(Date.now() / 1000);
      const expiresIn = claims.expiresIn ?? 3600;
      return new SignJWT({
        ...(claims.clientId === undefined
          ? {}
          : { client_id: claims.clientId, azp: claims.clientId }),
        scope: (claims.scopes ?? ['mcp']).join(' '),
      })
        .setProtectedHeader({ alg: SIGNING_ALGORITHM, kid: KEY_ID, typ: 'JWT' })
        .setSubject(claims.subject ?? 'user-1')
        .setIssuer(claims.issuer ?? issuer)
        .setAudience(claims.audience ?? resource)
        .setIssuedAt(now)
        .setExpirationTime(now + expiresIn)
        .sign(privateKey as CryptoKey);
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

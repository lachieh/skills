import type { DatabaseClient } from '<scope>/db';
import { oauthClient, oauthClientResource, oauthResource } from '<scope>/db/schema';
import { mcpDeviceOAuthClientId, cliOAuthClientId } from '<scope>/device-grant';
import { and, eq, inArray, ne } from 'drizzle-orm';

import { mcpResourceIdentifier, oauthScopes } from './auth-identifiers';

/**
 * The managed OAuth clients this deployment registers. They are public clients
 * (no secret): the device-code flow's security rests on the user approving the
 * code in the browser, not on client credentials. The identifiers themselves
 * live in `<scope>/device-grant`, so a client that can ask for a grant is
 * a client the server provisions — adding one is a change in both places, not
 * a string that happens to typecheck in a caller.
 */
export { mcpDeviceOAuthClientId, cliOAuthClientId };

/**
 * Each managed client is provisioned with only its own door's scopes. The two
 * clients share one protected resource, so a client holding both sets of
 * scopes could open both doors; the operator API also refuses any client but
 * the CLI, and this keeps the MCP client from even being issued an operator
 * scope.
 */
export const cliOAuthScopes = ['openid', 'offline_access', 'cli:read', 'cli:write', 'cli:deploy'];

export const mcpDeviceOAuthScopes = ['openid', 'offline_access', 'mcp', 'mcp:write'];

export const mcpResourceId = 'resource_mcp';

/**
 * Registers this deployment's MCP protected resource and its managed OAuth
 * clients against the authorization server's own tables. The
 * oauth-provider device grant refuses to issue tokens for a client or
 * resource it does not know, so `createBetterAuth` runs this on every
 * instance. Idempotent: rows are reconciled, never duplicated, and a client
 * row provisioned earlier has its scopes replaced rather than kept. The resource
 * row is keyed by a fixed id while its identifier carries the deployment
 * origin, so an origin change must update the row in place rather than
 * collide with it.
 */
export function ensureMcpOAuthProvisioning(database: DatabaseClient, origin: string): void {
  const resourceIdentifier = mcpResourceIdentifier(origin);
  const at = new Date();

  // The deployment origin is part of the resource identifier, so a moved
  // origin leaves a stale link behind; drop it before the identifier changes.
  database
    .delete(oauthClientResource)
    .where(
      and(
        inArray(oauthClientResource.clientId, [
          mcpDeviceOAuthClientId,
          cliOAuthClientId,
        ]),
        ne(oauthClientResource.resourceId, resourceIdentifier),
      ),
    )
    .run();

  database
    .delete(oauthResource)
    .where(
      and(
        eq(oauthResource.identifier, resourceIdentifier),
        ne(oauthResource.id, mcpResourceId),
      ),
    )
    .run();
  database
    .insert(oauthResource)
    .values({
      id: mcpResourceId,
      identifier: resourceIdentifier,
      name: 'MCP',
      allowedScopes: oauthScopes,
      disabled: false,
      createdAt: at,
      updatedAt: at,
    })
    .onConflictDoUpdate({
      target: oauthResource.id,
      set: {
        identifier: resourceIdentifier,
        name: 'MCP',
        allowedScopes: oauthScopes,
        disabled: false,
        updatedAt: at,
      },
    })
    .run();

  const mcpDeviceClient = {
    name: '<Project> MCP device client',
    // A public device-flow client: no secret, token endpoint auth 'none'.
    tokenEndpointAuthMethod: 'none',
    grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
    responseTypes: [],
    redirectUris: [],
    scopes: [...mcpDeviceOAuthScopes],
    skipConsent: true,
    disabled: false,
  };

  database
    .insert(oauthClient)
    .values({
      id: mcpDeviceOAuthClientId,
      clientId: mcpDeviceOAuthClientId,
      ...mcpDeviceClient,
      createdAt: at,
      updatedAt: at,
    })
    .onConflictDoUpdate({
      target: oauthClient.clientId,
      set: {
        ...mcpDeviceClient,
        updatedAt: at,
      },
    })
    .run();

  const cliClient = {
    name: '<Project> operator CLI',
    tokenEndpointAuthMethod: 'none',
    grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
    responseTypes: [],
    redirectUris: [],
    scopes: [...cliOAuthScopes],
    skipConsent: true,
    disabled: false,
  };

  database
    .insert(oauthClient)
    .values({
      id: cliOAuthClientId,
      clientId: cliOAuthClientId,
      ...cliClient,
      createdAt: at,
      updatedAt: at,
    })
    .onConflictDoUpdate({
      target: oauthClient.clientId,
      set: {
        ...cliClient,
        updatedAt: at,
      },
    })
    .run();

  const link = database
    .select({ id: oauthClientResource.id })
    .from(oauthClientResource)
    .where(
      and(
        eq(oauthClientResource.clientId, mcpDeviceOAuthClientId),
        eq(oauthClientResource.resourceId, resourceIdentifier),
      ),
    )
    .get();
  if (!link) {
    database
      .insert(oauthClientResource)
      .values({
        id: `link_${mcpDeviceOAuthClientId}`,
        clientId: mcpDeviceOAuthClientId,
        resourceId: resourceIdentifier,
        createdAt: at,
      })
      .run();
  }

  const cliLink = database
    .select({ id: oauthClientResource.id })
    .from(oauthClientResource)
    .where(
      and(
        eq(oauthClientResource.clientId, cliOAuthClientId),
        eq(oauthClientResource.resourceId, resourceIdentifier),
      ),
    )
    .get();
  if (!cliLink) {
    database
      .insert(oauthClientResource)
      .values({
        id: `link_${cliOAuthClientId}`,
        clientId: cliOAuthClientId,
        resourceId: resourceIdentifier,
        createdAt: at,
      })
      .run();
  }
}

import { createMcpProtectedRequestHandler } from '@better-auth/mcp';
import {
  OAuthError,
  OAuthErrorCode,
  bearerAuthChallengeResponse,
  createMcpHandler,
  getOAuthProtectedResourceMetadataUrl,
  hostHeaderValidationResponse,
  McpServer,
  originValidationResponse,
  type AuthInfo,
  type McpRequestContext,
} from '@modelcontextprotocol/server';

export type { AuthInfo, McpRequestContext };

/**
 * OAuth scope every access token must carry to talk to /mcp at all: it unlocks
 * the read tools. Advertised in the unauthenticated `WWW-Authenticate`
 * challenge so clients know what to request.
 */
export const MCP_READ_SCOPE = 'mcp';

/**
 * OAuth scope write tools additionally require. A token without it is refused
 * at the HTTP boundary with an RFC 6750 `insufficient_scope` challenge, so
 * clients can step up their authorization in one round-trip.
 */
export const MCP_WRITE_SCOPE = 'mcp:write';

/**
 * The Better Auth access-token claims the transport derives `authInfo` from.
 * `sub` is the Better Auth user id; `scope` is the granted scope string.
 */
export type McpAccessTokenClaims = {
  sub?: string;
  scope?: string | string[];
  client_id?: string;
  azp?: string;
  exp?: number;
} & Record<string, unknown>;

/** Parses the `scope` claim (space-separated string or array) into a list. */
export function mcpScopesFromClaims(claims: McpAccessTokenClaims): string[] {
  if (Array.isArray(claims.scope)) {
    return claims.scope.filter((scope): scope is string => typeof scope === 'string');
  }
  if (typeof claims.scope === 'string') {
    return claims.scope.split(/\s+/).filter((scope) => scope.length > 0);
  }
  return [];
}

/**
 * Derives the transport's verified identity from Better Auth access-token
 * claims. `sub` (the Better Auth user id) travels in `extra.userId`; the
 * requesting OAuth client lands in `clientId`.
 */
export function mcpAuthInfoFromClaims(claims: McpAccessTokenClaims, token: string): AuthInfo {
  const clientId =
    firstString(claims.client_id) ??
    firstString(claims.azp) ??
    firstString(claims.sub) ??
    'unknown-client';
  const expiresAt = typeof claims.exp === 'number' ? claims.exp : undefined;

  return {
    token,
    clientId,
    scopes: mcpScopesFromClaims(claims),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(claims.sub === undefined ? {} : { extra: { userId: claims.sub } }),
  };
}

/** The Better Auth user id the transport derived for this request, when present. */
export function mcpUserIdFromAuthInfo(
  source: AuthInfo | McpRequestContext | undefined,
): string | undefined {
  const extra =
    source === undefined ? undefined : 'era' in source ? source.authInfo?.extra : source.extra;
  const userId = extra?.['userId'];
  return typeof userId === 'string' && userId.length > 0 ? userId : undefined;
}

function firstString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function hasScopes(scopes: readonly string[] | undefined, required: readonly string[]): boolean {
  const granted = new Set(scopes ?? []);
  return required.every((scope) => granted.has(scope));
}

/**
 * Whether the verified caller holds the write scope. Write tool handlers can
 * consult this (or the registrar's `registerWriteTool`, which enforces it) to
 * gate mutations.
 */
export function hasMcpWriteScope(context: McpRequestContext): boolean {
  return hasScopes(context.authInfo?.scopes, [MCP_WRITE_SCOPE]);
}

/**
 * Registers this deployment's tool surface onto one per-request server
 * instance. Registrars receive the per-request server, the request context
 * (with the verified caller in `context.authInfo`), and a
 * `registerWriteTool` that gates the registered tool behind the
 * {@link MCP_WRITE_SCOPE} scope.
 */
export type McpToolRegistrar = (tools: McpToolRegistrarContext) => void;

export type McpToolRegistrarContext = {
  /** The per-request MCP server to register tools onto. */
  server: McpServer;
  /** The per-request serving context; carries the verified `authInfo`. */
  context: McpRequestContext;
  /**
   * Registers a mutating tool. Calls must carry the {@link MCP_WRITE_SCOPE}
   * scope: the transport answers a token without it with an RFC 6750
   * `insufficient_scope` challenge, and the tool itself refuses to run as a
   * backstop. Future write tools inherit the gate by registering here.
   */
  registerWriteTool: McpServer['registerTool'];
};

export type CreateMcpFetchHandlerOptions = {
  serverName: string;
  serverVersion: string;
  allowedHosts: string[];
  allowedOrigins: string[];
  /** Expected access-token issuer: the Better Auth base URL. */
  issuer: string;
  /** Canonical `/mcp` resource URL tokens must be audience-bound to. */
  resource: string;
  /** The authorization server's JWKS URL (Better Auth serves `/api/auth/jwks`). */
  jwksUrl: string;
  tools?: McpToolRegistrar[];
  /**
   * Scopes every accepted access token must satisfy. Defaults to
   * {@link MCP_READ_SCOPE} only; write scope is enforced per write tool.
   */
  requiredScopes?: readonly string[];
  /**
   * Response shaping handed to the underlying serving entry. Defaults to the
   * SDK's `auto`; `json` keeps every exchange a single JSON body.
   */
  responseMode?: 'auto' | 'sse' | 'json';
};

function writeScopeChallengeResponse(resource: string): Response {
  return bearerAuthChallengeResponse(
    new OAuthError(
      OAuthErrorCode.InsufficientScope,
      `This operation requires the ${MCP_WRITE_SCOPE} scope. Re-authorize to step up.`,
    ),
    {
      requiredScopes: [MCP_WRITE_SCOPE],
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(new URL(resource)),
    },
  );
}

/** Extracts `params.name` from a `tools/call` JSON-RPC request body. */
async function writeToolNameFromRequest(request: Request): Promise<string | undefined> {
  if (request.method.toUpperCase() !== 'POST') return undefined;
  try {
    const body: unknown = await request.clone().json();
    if (typeof body !== 'object' || body === null) return undefined;
    if ((body as { method?: unknown }).method !== 'tools/call') return undefined;
    const params = (body as { params?: unknown }).params;
    if (typeof params !== 'object' || params === null) return undefined;
    const name = (params as { name?: unknown }).name;
    return typeof name === 'string' && name.length > 0 ? name : undefined;
  } catch {
    // Not usable JSON; leave the answer to the MCP transport.
    return undefined;
  }
}

function bearerTokenFrom(request: Request): string {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer[ ]+(\S.*)$/i.exec(header.trim());
  return match ? match[1].trim() : '';
}

export function createMcpFetchHandler(options: CreateMcpFetchHandlerOptions) {
  const requiredScopes = options.requiredScopes ?? [MCP_READ_SCOPE];
  // Write-tool names learned from the registrars. Registrars run per request,
  // so the set fills from the first served request onward; the per-tool
  // backstop inside `registerWriteTool` keeps enforcement exact even for a
  // write call that arrives before any registration has been observed.
  const writeToolNames = new Set<string>();

  const serveMcp = createMcpHandler(
    (factoryContext) => {
      const server = new McpServer({
        name: options.serverName,
        version: options.serverVersion,
      });

      for (const registerTools of options.tools ?? []) {
        registerTools({
          server,
          context: factoryContext,
          registerWriteTool: ((
            name: string,
            config: Parameters<McpServer['registerTool']>[1],
            callback: Parameters<McpServer['registerTool']>[2],
          ) => {
            writeToolNames.add(name);
            return server.registerTool(name, config, (async (
              args: unknown,
              handlerContext: unknown,
            ) => {
              if (!hasScopes(factoryContext.authInfo?.scopes, [MCP_WRITE_SCOPE])) {
                return {
                  content: [
                    {
                      type: 'text' as const,
                      text:
                        `This tool requires the ${MCP_WRITE_SCOPE} scope. ` +
                        'Re-authorize with that scope and retry.',
                    },
                  ],
                  isError: true as const,
                };
              }
              const invoke = callback as unknown as (args: unknown, context: unknown) => unknown;
              return invoke(args, handlerContext);
            }) as Parameters<McpServer['registerTool']>[2]);
          }) as McpServer['registerTool'],
        });
      }

      return server;
    },
    options.responseMode ? { responseMode: options.responseMode } : undefined,
  );

  // Better Auth's MCP protection: verify the bearer token against the
  // authorization server's JWKS (signature, issuer, audience, expiry), require
  // the read scope, and answer unauthenticated calls with the RFC 9728
  // `WWW-Authenticate` challenge.
  const protectedHandler = createMcpProtectedRequestHandler(
    {
      issuer: options.issuer,
      audience: options.resource,
      jwksUrl: options.jwksUrl,
      requiredScopes,
      challengeScopes: requiredScopes,
    },
    async (request, claims) => {
      const authInfo = mcpAuthInfoFromClaims(claims, bearerTokenFrom(request));

      const writeToolName = await writeToolNameFromRequest(request);
      if (
        writeToolName !== undefined &&
        writeToolNames.has(writeToolName) &&
        !hasScopes(authInfo.scopes, [MCP_WRITE_SCOPE])
      ) {
        return writeScopeChallengeResponse(options.resource);
      }

      return serveMcp.fetch(request, { authInfo });
    },
  );

  return async function handleMcpRequest(request: Request): Promise<Response> {
    // DNS-rebinding protection: the Host header must name an allow-listed host.
    const hostRejection = hostHeaderValidationResponse(request, options.allowedHosts);
    if (hostRejection) return hostRejection;

    // Cross-origin protection: browsers always send Origin on cross-site
    // requests; non-browser clients may omit it.
    const originRejection = originValidationResponse(request, options.allowedOrigins);
    if (originRejection) return originRejection;

    return protectedHandler(request);
  };
}

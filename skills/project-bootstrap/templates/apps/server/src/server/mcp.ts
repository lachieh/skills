import { createMcpFetchHandler } from '<scope>/mcp';
import { Data, Effect } from 'effect';

import { AuthConfig, McpConfig } from '../runtime/config';
import { createServerOwner } from '../runtime/owner-resources';
import { runServerEffect, type ServerEffectRunner } from '../runtime/server-effect';
import {
  betterAuthIssuerURL,
  betterAuthJwksURL,
  mcpResourceIdentifier,
} from './auth-identifiers';
import { createMcpTools } from './mcp-tools';
import { describeMcpTools, mcpServerCard, type McpToolSummary } from './mcp-server-card';

const MCP_SERVER_NAME = '<cookie>';
const MCP_SERVER_VERSION = '0.0.0';

const LOCALHOST_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

export class McpEndpointUnavailable extends Data.TaggedError('McpEndpointUnavailable')<{
  readonly operation: string;
}> {}

/**
 * Parses a comma-separated hostname allowlist. Blank values fall back to the
 * localhost hostnames plus the deployment's own hostname, so the door answers
 * at the origin its resource identifier is bound to without configuration.
 */
export function parseConfiguredHostnames(
  value: string | undefined,
  deploymentOrigin = 'http://localhost:3000',
): string[] {
  const entries = (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (entries.length > 0) return entries;

  const deploymentHostname = new URL(deploymentOrigin).hostname;
  return LOCALHOST_HOSTNAMES.includes(deploymentHostname)
    ? LOCALHOST_HOSTNAMES
    : [...LOCALHOST_HOSTNAMES, deploymentHostname];
}

type ConfiguredMcp = {
  readonly handleMcpRequest: ReturnType<typeof createMcpFetchHandler>;
  readonly tools: McpToolSummary[];
};

function createMcpConfiguration(
  run: ServerEffectRunner,
): Effect.Effect<ConfiguredMcp, McpEndpointUnavailable, AuthConfig | McpConfig> {
  return Effect.gen(function* () {
    const authConfig = yield* AuthConfig;
    const mcpConfig = yield* McpConfig;
    return yield* Effect.try({
      try: () => {
        const registrar = createMcpTools((effect) => run(effect));
        return {
          handleMcpRequest: createMcpFetchHandler({
            serverName: MCP_SERVER_NAME,
            serverVersion: MCP_SERVER_VERSION,
            allowedHosts: parseConfiguredHostnames(mcpConfig.allowedHosts, authConfig.origin),
            allowedOrigins: parseConfiguredHostnames(mcpConfig.allowedOrigins, authConfig.origin),
            issuer: betterAuthIssuerURL(authConfig.origin),
            resource: mcpResourceIdentifier(authConfig.origin),
            jwksUrl: betterAuthJwksURL(authConfig.origin),
            tools: [registrar],
            responseMode: 'json',
          }),
          tools: describeMcpTools(registrar),
        } satisfies ConfiguredMcp;
      },
      catch: () => new McpEndpointUnavailable({ operation: 'configure' }),
    });
  });
}

const MCP_CONFIGURATION = Symbol('mcp-configuration');

/**
 * The MCP configuration is expensive to build and holds no connection of its
 * own, so it is acquired once per runtime owner. Keying it on the owner rather
 * than on configuration is what keeps two owners in one process from sharing
 * each other's tools, and a failed build is retried by the next caller instead
 * of being remembered.
 */
function getConfiguredMcp(run: ServerEffectRunner): Promise<ConfiguredMcp> {
  return createServerOwner(run).own(MCP_CONFIGURATION, createMcpConfiguration(run));
}

export function getMcpRequestHandler(
  run: ServerEffectRunner = runServerEffect,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const configured = await getConfiguredMcp(run);
    return configured.handleMcpRequest(request);
  };
}

export function getMcpServerCard(
  origin: string,
  run: ServerEffectRunner = runServerEffect,
): Promise<ReturnType<typeof mcpServerCard>> {
  return getConfiguredMcp(run).then((configured) =>
    mcpServerCard({
      origin,
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      tools: configured.tools,
    }),
  );
}

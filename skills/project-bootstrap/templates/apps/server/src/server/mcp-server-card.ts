import type { McpToolRegistrar, McpToolRegistrarContext } from '<scope>/mcp';

type McpServer = McpToolRegistrarContext['server'];

export type McpToolSummary = {
  name: string;
  title?: string;
  description?: string;
  scope: 'mcp' | 'mcp:write';
};

// Runs a registrar against a recording server so the card lists exactly the
// tools the live /mcp endpoint registers, without opening a transport.
export function describeMcpTools(registrar: McpToolRegistrar): McpToolSummary[] {
  const tools: McpToolSummary[] = [];
  const record =
    (scope: McpToolSummary['scope']) =>
    (name: string, config: { title?: string; description?: string }) => {
      tools.push({ name, title: config.title, description: config.description, scope });
      return undefined as never;
    };
  const context = {
    server: { registerTool: record('mcp') } as unknown as McpServer,
    context: { authInfo: undefined },
    registerWriteTool: record('mcp:write') as McpServer['registerTool'],
  } as McpToolRegistrarContext;
  registrar(context);
  return tools;
}

export function mcpServerCard(input: {
  origin: string;
  name: string;
  version: string;
  tools: McpToolSummary[];
}) {
  return {
    name: input.name,
    description:
      'Model Context Protocol server for <Project>.',
    version: input.version,
    serverUrl: `${input.origin}/mcp`,
    transport: 'streamable-http',
    authentication: {
      type: 'oauth2',
      resourceMetadata: `${input.origin}/.well-known/oauth-protected-resource`,
      scopes: ['mcp', 'mcp:write'],
    },
    tools: input.tools.map((tool) => ({
      name: tool.name,
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.description ? { description: tool.description } : {}),
      scope: tool.scope,
    })),
  };
}

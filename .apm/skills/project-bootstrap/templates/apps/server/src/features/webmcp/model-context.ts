export type ToolAnnotations = {
  readOnlyHint?: boolean;
  consequentialHint?: boolean;
  untrustedContentHint?: boolean;
};

export type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: ToolAnnotations;
  execute(input: unknown, context?: { signal: AbortSignal }): Promise<unknown>;
};

export type RegisterToolOptions = { signal?: AbortSignal };

/** The `document.modelContext` surface of the WebMCP draft, narrowed to what this app uses. */
export type ModelContext = {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): Promise<undefined>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

export function findModelContext(): ModelContext | null {
  if (typeof document === 'undefined') return null;
  const candidate: unknown = document.modelContext;
  if (typeof candidate !== 'object' || candidate === null) return null;
  const context = candidate as ModelContext;
  return typeof context.registerTool === 'function' ? context : null;
}

import { z } from 'zod';

import type { ModelContextTool, ToolAnnotations } from './model-context';

export type WebMcpTool = ModelContextTool;

export const readOnly: ToolAnnotations = { readOnlyHint: true };

export type ToolSpec<Schema extends z.ZodObject> = {
  name: string;
  description: string;
  title?: string;
  annotations?: ToolAnnotations;
  input: Schema;
  execute(input: z.infer<Schema>): Promise<unknown> | unknown;
};

function summarizeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

export function defineTool<Schema extends z.ZodObject>(spec: ToolSpec<Schema>): WebMcpTool {
  return {
    name: spec.name,
    ...(spec.title === undefined ? {} : { title: spec.title }),
    description: spec.description,
    // Input mode keeps defaulted fields out of `required`, so an agent sees
    // which arguments it may omit.
    inputSchema: z.toJSONSchema(spec.input, { io: 'input' }),
    ...(spec.annotations === undefined ? {} : { annotations: spec.annotations }),
    async execute(raw) {
      const parsed = spec.input.safeParse(raw);
      if (!parsed.success) {
        return { error: `Invalid input for ${spec.name}: ${summarizeIssues(parsed.error)}` };
      }
      return await spec.execute(parsed.data);
    },
  };
}

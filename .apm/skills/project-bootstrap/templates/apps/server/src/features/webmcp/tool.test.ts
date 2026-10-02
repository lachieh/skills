import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { defineTool } from './tool';

describe('defineTool', () => {
  it('emits the zod schema as the tool JSON Schema', () => {
    const tool = defineTool({
      name: 'search_things',
      title: 'Search things',
      description: 'Searches things.',
      annotations: { readOnlyHint: true },
      input: z.object({ query: z.string().max(200), page: z.number().int().min(1).default(1) }),
      execute: () => null,
    });

    expect(tool.name).toBe('search_things');
    expect(tool.title).toBe('Search things');
    expect(tool.annotations).toEqual({ readOnlyHint: true });
    expect(tool.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        query: { type: 'string', maxLength: 200 },
        page: { type: 'integer', minimum: 1, default: 1 },
      },
      required: ['query'],
    });
  });

  it('rejects invalid input without calling the handler', async () => {
    const execute = vi.fn();
    const tool = defineTool({
      name: 'open_thing',
      description: 'Opens a thing.',
      input: z.object({ id: z.string().min(1) }),
      execute,
    });

    const result = await tool.execute({ id: 42 });

    expect(execute).not.toHaveBeenCalled();
    expect(result).toEqual({ error: expect.stringContaining('open_thing') });
    expect((result as { error: string }).error).toContain('id');
  });

  it('passes parsed input to the handler and returns its value', async () => {
    const tool = defineTool({
      name: 'open_thing',
      description: 'Opens a thing.',
      input: z.object({ id: z.string().trim(), page: z.number().default(1) }),
      execute: (input) => ({ opened: input.id, page: input.page }),
    });

    await expect(tool.execute({ id: '  wall  ' })).resolves.toEqual({ opened: 'wall', page: 1 });
  });
});

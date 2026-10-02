// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { ModelContext, ModelContextTool, RegisterToolOptions } from './model-context';
import { WebMcpProvider, useWebMcpTools } from './provider';
import { defineTool, type WebMcpTool } from './tool';

afterEach(() => {
  cleanup();
});

function createFakeModelContext() {
  const calls: Array<{ tool: ModelContextTool; signal: AbortSignal | undefined }> = [];
  const modelContext: ModelContext = {
    async registerTool(tool: ModelContextTool, options?: RegisterToolOptions) {
      calls.push({ tool, signal: options?.signal });
      return undefined;
    },
  };
  return { modelContext, calls };
}

const tool = (name: string): WebMcpTool =>
  defineTool({ name, description: `Does ${name}.`, input: z.object({}), execute: () => null });

function ToolHost({ tools }: { tools: readonly WebMcpTool[] }) {
  useWebMcpTools(tools);
  return null;
}

describe('useWebMcpTools', () => {
  it('registers every tool on mount and aborts the signal on unmount', () => {
    const { modelContext, calls } = createFakeModelContext();
    const tools = [tool('first_tool'), tool('second_tool')];

    const view = render(
      <WebMcpProvider modelContext={modelContext}>
        <ToolHost tools={tools} />
      </WebMcpProvider>,
    );

    expect(calls.map((call) => call.tool.name)).toEqual(['first_tool', 'second_tool']);
    expect(calls.every((call) => call.signal?.aborted === false)).toBe(true);

    view.unmount();

    expect(calls.every((call) => call.signal?.aborted === true)).toBe(true);
  });

  it('registers nothing when no model context is available', () => {
    const { calls } = createFakeModelContext();

    render(
      <WebMcpProvider modelContext={null}>
        <ToolHost tools={[tool('first_tool')]} />
      </WebMcpProvider>,
    );

    expect(calls).toEqual([]);
  });

  it('re-registers when the tools array identity changes', () => {
    const { modelContext, calls } = createFakeModelContext();

    const view = render(
      <WebMcpProvider modelContext={modelContext}>
        <ToolHost tools={[tool('first_tool')]} />
      </WebMcpProvider>,
    );
    const firstSignal = calls[0]?.signal;

    view.rerender(
      <WebMcpProvider modelContext={modelContext}>
        <ToolHost tools={[tool('replacement_tool')]} />
      </WebMcpProvider>,
    );

    expect(firstSignal?.aborted).toBe(true);
    expect(calls.map((call) => call.tool.name)).toEqual(['first_tool', 'replacement_tool']);
    expect(calls[1]?.signal?.aborted).toBe(false);
  });
});

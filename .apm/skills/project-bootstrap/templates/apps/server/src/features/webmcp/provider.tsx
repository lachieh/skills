import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';

import { findModelContext, type ModelContext } from './model-context';
import type { WebMcpTool } from './tool';

const WebMcpContext = createContext<ModelContext | null>(null);

// The browser exposes `document.modelContext` before hydration and never
// swaps it, so an unsubscribing store is enough to keep the server render
// (and the hydrating render) at null while the client render sees the API.
const subscribe = () => () => undefined;
const serverSnapshot = () => null;

export function WebMcpProvider({
  modelContext,
  children,
}: {
  modelContext?: ModelContext | null;
  children: ReactNode;
}) {
  const discovered = useSyncExternalStore(subscribe, findModelContext, serverSnapshot);

  return (
    <WebMcpContext.Provider value={modelContext === undefined ? discovered : modelContext}>
      {children}
    </WebMcpContext.Provider>
  );
}

/** Registers `tools` while the calling component is mounted. Callers must memoize the array. */
export function useWebMcpTools(tools: readonly WebMcpTool[]): void {
  const modelContext = useContext(WebMcpContext);

  useEffect(() => {
    if (!modelContext) return;
    const controller = new AbortController();
    for (const tool of tools) {
      void Promise.resolve(modelContext.registerTool(tool, { signal: controller.signal })).catch(
        () => undefined,
      );
    }
    return () => controller.abort();
  }, [modelContext, tools]);
}

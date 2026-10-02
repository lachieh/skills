import { Cause, ConfigProvider, Effect, Exit, Layer, ManagedRuntime, Option } from 'effect';

import {
  AuthConfig,
  AuthConfigUnavailable,
  authConfigLayer,
  McpConfig,
  McpConfigUnavailable,
  mcpConfigLayer,
  ServerConfig,
  ServerConfigUnavailable,
  serverConfigLayer,
} from './config';
import {
  makeSqliteConnectionLayer,
  SqliteConnection,
  SqliteConnectionUnavailable,
  type OpenDatabase,
} from './sqlite-connection';

type ServerRuntimeManaged = ManagedRuntime.ManagedRuntime<
  ServerEffectContext,
  ServerConfigUnavailable | AuthConfigUnavailable | McpConfigUnavailable | SqliteConnectionUnavailable
>;

/**
 * Everything an Effect run by the server may require. A service layer built on
 * the connection (an auth service, an MCP tool door) joins this union, the
 * error union above, and the `Layer.provideMerge` chain in
 * `createServerRuntime`. Drop `AuthConfig` and `McpConfig` when their modules
 * are not selected.
 */
export type ServerEffectContext = ServerConfig | AuthConfig | McpConfig | SqliteConnection;

export type ServerEffectRunner = <A, E>(
  effect: Effect.Effect<A, E, ServerEffectContext>,
) => Promise<A>;

export type ServerRuntimeOwner = {
  readonly runtime: ServerRuntimeManaged;
  readonly dispose: () => Promise<void>;
};

export type ServerRuntimeConfig = {
  readonly config?: Layer.Layer<
    ServerConfig,
    ServerConfigUnavailable,
    ConfigProvider.ConfigProvider
  >;
  readonly configProvider?: ConfigProvider.ConfigProvider;
  readonly openDatabase?: OpenDatabase;
};

export function createServerRuntime({
  config,
  configProvider = ConfigProvider.fromEnv(),
  openDatabase,
}: ServerRuntimeConfig = {}): ServerRuntimeOwner {
  const authConfig = authConfigLayer(configProvider);
  const mcpConfig = mcpConfigLayer(configProvider);
  const serverConfig = config ?? serverConfigLayer(configProvider);
  const ServerRuntimeBase = Layer.unwrapEffect(
    Effect.map(ServerConfig, (value) =>
      Layer.merge(
        makeSqliteConnectionLayer(value.databaseUrl, openDatabase),
        Layer.merge(Layer.succeed(ServerConfig, value), Layer.merge(authConfig, mcpConfig)),
      ),
    ),
  ).pipe(Layer.provide(serverConfig), Layer.provide(Layer.setConfigProvider(configProvider)));
  // Service layers stack here: Layer.provideMerge(ServiceLive, ServerRuntimeBase).
  const ServerRuntimeLive = ServerRuntimeBase;
  const runtime: ServerRuntimeManaged = ManagedRuntime.make(ServerRuntimeLive);
  let disposal: Promise<void> | undefined;

  return {
    runtime,
    dispose: () => (disposal ??= runtime.dispose()),
  };
}

type SignalEmitter = Pick<NodeJS.Process, 'on' | 'off'> | EventTarget;
type HotContext = { dispose: (callback: () => void) => void };

export function installServerRuntimeLifecycle({
  dispose,
  hot = import.meta.hot,
  signalEmitter = process,
}: {
  readonly dispose: () => Promise<void>;
  readonly hot?: HotContext | undefined;
  readonly signalEmitter?: SignalEmitter;
}): { readonly dispose: () => void } {
  const signals = ['SIGINT', 'SIGTERM'] as const;
  let installed = true;
  let disposal: Promise<void> | undefined;
  const listeners = new Map<(typeof signals)[number], () => void>();
  const disposeOnce = () => (disposal ??= dispose());
  const reportDisposalFailure = (error: unknown) => {
    console.error('Effect runtime disposal failed', error);
  };
  const disposeInBackground = () => {
    try {
      void disposeOnce().catch(reportDisposalFailure);
    } catch (error) {
      reportDisposalFailure(error);
    }
  };
  const removeSignalListeners = () => {
    for (const signal of signals) {
      const listener = listeners.get(signal);
      if (!listener) continue;
      if ('on' in signalEmitter) signalEmitter.off(signal, listener);
      else signalEmitter.removeEventListener(signal, listener);
      listeners.delete(signal);
    }
  };
  const handleSignal = () => {
    if (!installed) return;
    disposeInBackground();
  };
  const handleHotDispose = () => {
    if (!installed) return;
    installed = false;
    removeSignalListeners();
    disposeInBackground();
  };

  hot?.dispose(handleHotDispose);
  for (const signal of signals) {
    const listener = () => handleSignal();
    listeners.set(signal, listener);
    if ('on' in signalEmitter) signalEmitter.on(signal, listener);
    else signalEmitter.addEventListener(signal, listener);
  }

  return {
    dispose: () => {
      if (!installed) return;
      installed = false;
      removeSignalListeners();
      disposeInBackground();
    },
  };
}

async function exitAsPromise<A, E>(exitPromise: Promise<Exit.Exit<A, E>>): Promise<A> {
  const exit = await exitPromise;
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) throw failure.value;
  throw Cause.squash(exit.cause);
}

async function runRuntimeEffect<A, E>(
  runtime: ServerRuntimeManaged,
  effect: Effect.Effect<A, E, ServerEffectContext>,
): Promise<A> {
  return exitAsPromise(runtime.runPromiseExit(effect));
}

export function runEffectPromise<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
  return exitAsPromise(Effect.runPromiseExit(effect));
}

let serverRuntimeOwner: ServerRuntimeOwner | undefined;
let removeDefaultRuntimeListeners: (() => void) | undefined;

function installDefaultRuntimeLifecycle(): void {
  if (removeDefaultRuntimeListeners) return;
  const lifecycle = installServerRuntimeLifecycle({
    dispose: async () => {
      try {
        await serverRuntimeOwner?.dispose();
      } finally {
        removeDefaultRuntimeListeners?.();
      }
    },
  });
  removeDefaultRuntimeListeners = lifecycle.dispose;
}

export function getServerRuntimeOwner(config?: ServerConfig['Type']): ServerRuntimeOwner {
  if (!serverRuntimeOwner) {
    serverRuntimeOwner = createServerRuntime(
      config === undefined ? {} : { config: Layer.succeed(ServerConfig, config) },
    );
    installDefaultRuntimeLifecycle();
  }
  return serverRuntimeOwner;
}

export function runServerEffectWithOwner(owner: ServerRuntimeOwner): ServerEffectRunner {
  return (effect) => runRuntimeEffect(owner.runtime, effect);
}

export const runServerEffect: ServerEffectRunner = (effect) =>
  runRuntimeEffect(
    getServerRuntimeOwner().runtime,
    effect.pipe(Effect.tapError((error) => Effect.logError('server Effect failed', error))),
  );

export type IsolatedServerEffectOptions = {
  readonly configProvider?: ConfigProvider.ConfigProvider;
};

export function runIsolatedServerEffect<A, E>(
  effect: Effect.Effect<A, E, ServerEffectContext>,
  { configProvider }: IsolatedServerEffectOptions = {},
): Promise<A> {
  const owner = createServerRuntime({ configProvider });
  const disposeAfterTurn = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 0)).then(() => owner.dispose());
  return runRuntimeEffect(owner.runtime, effect).then(
    (value) => disposeAfterTurn().then(() => value),
    (error: unknown) => disposeAfterTurn().then(() => Promise.reject(error)),
  );
}

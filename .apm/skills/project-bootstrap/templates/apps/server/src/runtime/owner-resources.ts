import type { Effect } from 'effect';

import type { ServerEffectContext, ServerEffectRunner } from './server-effect';

/**
 * One runtime instance owns exactly one SQLite connection, and each expensive
 * per-owner resource — a built API handler, an MCP configuration — may be
 * acquired at most once from it. `docs/plans/effect-migration/runtime-ownership.md`
 * explains why the production bundle and the Vite SSR graph are two owners and
 * not one: they are separate module graphs with separate connections, so a
 * resource may never be shared between them.
 *
 * The only sound cache key is therefore owner identity. A configuration value
 * such as `DATABASE_URL` is not identity: two owners in one process (or two
 * tests) can be configured identically and still hold different connections,
 * and keying on the string hands one owner's connection to the other.
 *
 * `run` is the owner's runner. `runServerEffectWithOwner` mints exactly one
 * function per owner, so the function's identity is the owner's identity, and a
 * `WeakMap` keyed on it lets a disposed owner be collected with its resources.
 */
export type ServerOwner = {
  readonly run: ServerEffectRunner;
  /**
   * Runs `effect` through this owner at most once per `token`, and hands every
   * later caller the same value. The token must be a module-level `symbol`, so
   * two owners holding the same token still build independently.
   *
   * A failed build is not memoized: the rejection reaches the caller, the entry
   * is dropped, and the next caller rebuilds. A transient failure must not
   * disable a live endpoint for the rest of the process.
   */
  own<A, E>(token: symbol, effect: Effect.Effect<A, E, ServerEffectContext>): Promise<A>;
};

const owners = new WeakMap<ServerEffectRunner, ServerOwner>();

/**
 * The owner for `run`, memoized on the runner's identity, so a surface that is
 * asked for a handler per request still builds its resource once.
 */
export function createServerOwner(run: ServerEffectRunner): ServerOwner {
  const existing = owners.get(run);
  if (existing) return existing;

  const resources = new Map<symbol, Promise<unknown>>();
  const owner: ServerOwner = {
    run,
    own: <A, E>(token: symbol, effect: Effect.Effect<A, E, ServerEffectContext>): Promise<A> => {
      const memoized = resources.get(token);
      if (memoized) return memoized as Promise<A>;

      // The in-flight promise is stored before it settles, so two callers racing
      // on the same token share one build instead of both opening a connection.
      const building = run(effect);
      resources.set(token, building);
      building.catch(() => {
        if (resources.get(token) === building) resources.delete(token);
      });
      return building;
    },
  };
  owners.set(run, owner);
  return owner;
}

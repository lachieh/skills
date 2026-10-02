import {
  archiveDivergedDatabase,
  createDatabase,
  migrateDatabase,
  seedReferenceData,
  type DatabaseClient,
  type DatabaseConnection,
} from '<scope>/db';
import { Data, Effect } from 'effect';

import { loadServerConfig, ServerConfigUnavailable, type ServerConfigValue } from './config.js';
import type { OpenDatabase } from './sqlite-connection.js';

export class ServerDatabaseStartupUnavailable extends Data.TaggedError(
  'ServerDatabaseStartupUnavailable',
) {}

export type ServerDatabaseConfig = {
  readonly databaseUrl: string;
  readonly databaseAutoReset: 'on' | 'off';
  readonly nodeEnvironment: string;
};

type DatabaseStartupOperations = {
  readonly archiveDatabase: (databaseUrl: string) => string | undefined;
  readonly migrate: (database: DatabaseClient) => void;
  readonly openDatabase: OpenDatabase;
  readonly seed: (database: DatabaseClient) => void;
  readonly warn: (message: string) => void;
};

const defaultOperations: DatabaseStartupOperations = {
  archiveDatabase: archiveDivergedDatabase,
  migrate: migrateDatabase,
  openDatabase: createDatabase,
  seed: seedReferenceData,
  warn: (message) => console.warn(message),
};

const unavailable = () => new ServerDatabaseStartupUnavailable();

export function startServerDatabase(): Promise<ServerConfigValue> {
  const startup = loadServerConfig.pipe(
    Effect.flatMap((config) => Effect.map(prepareServerDatabase(config), () => config)),
  ) as Effect.Effect<ServerConfigValue, ServerConfigUnavailable | ServerDatabaseStartupUnavailable>;
  return Effect.runPromise(startup);
}

export function prepareServerDatabase(
  config: ServerDatabaseConfig,
  operations: DatabaseStartupOperations = defaultOperations,
): Effect.Effect<void, ServerDatabaseStartupUnavailable> {
  const openConnection = Effect.acquireRelease(
    Effect.try({
      try: () => operations.openDatabase(config.databaseUrl),
      catch: unavailable,
    }),
    (connection: DatabaseConnection) => Effect.sync(() => connection.close()),
  );

  const migrateAttempt = Effect.scoped(
    Effect.gen(function* () {
      const connection = yield* openConnection;
      return yield* Effect.exit(
        Effect.try({
          try: () => operations.migrate(connection.database),
          catch: unavailable,
        }),
      );
    }),
  );

  const migrateAndSeedAttempt = Effect.scoped(
    Effect.gen(function* () {
      const connection = yield* openConnection;
      yield* Effect.try({
        try: () => {
          operations.migrate(connection.database);
          operations.seed(connection.database);
        },
        catch: unavailable,
      });
    }),
  );

  return Effect.gen(function* () {
    const firstAttempt = yield* Effect.exit(migrateAttempt);
    if (firstAttempt._tag === 'Failure') return yield* Effect.fail(unavailable());
    if (firstAttempt.value._tag === 'Success') return;

    if (config.databaseAutoReset === 'off' || config.nodeEnvironment === 'production') {
      return yield* Effect.fail(unavailable());
    }

    const archived = yield* Effect.try({
      try: () => operations.archiveDatabase(config.databaseUrl),
      catch: unavailable,
    });
    yield* Effect.sync(() =>
      operations.warn(
        `[<project>] database schema diverged from the migration chain; ` +
          `archived ${archived ?? 'the in-memory database'} and rebuilding from zero`,
      ),
    );
    yield* migrateAndSeedAttempt;
  });
}

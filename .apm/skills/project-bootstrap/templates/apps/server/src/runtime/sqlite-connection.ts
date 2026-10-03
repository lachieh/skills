import { createDatabase, type DatabaseConnection } from '<scope>/db';
import { Context, Data, Effect, Layer } from 'effect';

export class SqliteConnectionUnavailable extends Data.TaggedError('SqliteConnectionUnavailable') {}

export class SqliteConnection extends Context.Service<SqliteConnection, DatabaseConnection>()(
  '<scope>/SqliteConnection',
) {}

export type OpenDatabase = (databaseUrl: string) => DatabaseConnection;

export function makeSqliteConnectionLayer(
  databaseUrl: string,
  openDatabase: OpenDatabase = createDatabase,
) {
  return Layer.effect(
    SqliteConnection,
    Effect.acquireRelease(
      Effect.try({
        try: () => openDatabase(databaseUrl),
        catch: () => new SqliteConnectionUnavailable(),
      }),
      (connection) => Effect.sync(() => connection.close()),
    ),
  );
}

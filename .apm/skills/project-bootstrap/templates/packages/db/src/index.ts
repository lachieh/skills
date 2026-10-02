import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema/index';

export type DatabaseClient = BetterSQLite3Database<typeof schema>;

export type DatabaseConnection = {
  database: DatabaseClient;
  close: () => void;
};

/**
 * Opens `source`: a file path, `':memory:'`, or a serialized database image,
 * which opens as a private in-memory copy.
 */
export function createDatabase(source: string | Buffer): DatabaseConnection {
  const sqlite = new Database(source);
  sqlite.pragma('foreign_keys = ON');

  return {
    database: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

/**
 * A connection that cannot write. Tooling that inspects a production snapshot
 * gets the read-only guarantee from the connection mode, not from convention.
 */
export function createReadOnlyDatabase(filename: string): DatabaseConnection {
  const sqlite = new Database(filename, { readonly: true });

  return {
    database: drizzle(sqlite, { schema }),
    close: () => sqlite.close(),
  };
}

/**
 * The composition root. Every export here opens a connection, runs a migration
 * or drives the SQLite driver, so a value import of this module is a value
 * import of `better-sqlite3`, evaluated at module load. Code a browser bundle
 * can reach imports types from here and values from a narrower entry
 * (`<scope>/db/schema`, or a dedicated export), never this index.
 */
export { migrateDatabase } from './migrate';
// Idempotent reference rows every deployment needs; runs after a rebuild.
export { seedReferenceData } from './seed';
export { archiveDivergedDatabase } from './repair';

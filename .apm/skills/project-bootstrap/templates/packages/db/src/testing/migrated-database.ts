import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { createDatabase, type DatabaseConnection } from '../index';
import { migrateDatabase } from '../migrate';
import * as schema from '../schema/index';

let cachedImage: Buffer | undefined;

/**
 * A serialized SQLite database with every migration applied, built once per
 * process.
 *
 * Replaying the migrations, seed data included, costs about a quarter of a
 * second of CPU idle and several seconds on a loaded CI runner. Opening a copy
 * of this image costs about a millisecond.
 */
export function migratedDatabaseImage(): Buffer {
  if (cachedImage) return cachedImage;
  const sqlite = new Database(':memory:');
  try {
    // The pragma createDatabase sets, so the migrations run as they do in production.
    sqlite.pragma('foreign_keys = ON');
    migrateDatabase(drizzle(sqlite, { schema }));
    cachedImage = sqlite.serialize();
  } finally {
    sqlite.close();
  }
  return cachedImage;
}

/**
 * A fresh, fully migrated, in-memory database. Each call is independent: writes
 * to one never reach the image or another copy.
 */
export function createMigratedDatabase(
  image: Buffer = migratedDatabaseImage(),
): DatabaseConnection {
  return createDatabase(image);
}

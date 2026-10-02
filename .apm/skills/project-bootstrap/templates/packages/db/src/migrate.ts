import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import type { DatabaseClient } from './index';

export const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

export function migrateDatabase(database: DatabaseClient) {
  migrate(database, { migrationsFolder });
}

import { copyFileSync, readFileSync } from 'node:fs';

import type { DatabaseConnection } from '<scope>/db';
import { createMigratedDatabase } from '<scope>/db/testing';
import { inject } from 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    /** A SQLite file with every migration applied, built once per test run. */
    migratedDatabaseTemplate: string;
  }
}

/*
 * Migrating from nothing replays the seed-data migrations, which costs about a
 * quarter of a second of CPU on an idle machine and several seconds on a loaded
 * CI runner, enough to push a test past its timeout. `vitest.global-setup.ts`
 * migrates one template before any test starts, so a test pays only for a copy.
 */

let image: Buffer | undefined;

/** A fresh, fully migrated, in-memory database, independent of every other. */
export function openMigratedDatabase(): DatabaseConnection {
  image ??= readFileSync(inject('migratedDatabaseTemplate'));
  return createMigratedDatabase(image);
}

/** Writes a fully migrated SQLite database to `path`. */
export function copyMigratedDatabase(path: string): void {
  copyFileSync(inject('migratedDatabaseTemplate'), path);
}

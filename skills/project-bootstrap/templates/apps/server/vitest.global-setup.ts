import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { migratedDatabaseImage } from '<scope>/db/testing';
import type { TestProject } from 'vitest/node';

/** Migrates the one template every test database is opened from (src/testing/migrated-database.ts). */
export default function setup(project: TestProject) {
  const directory = mkdtempSync(join(tmpdir(), '<cookie>-migrated-template-'));
  const template = join(directory, 'migrated.sqlite');
  writeFileSync(template, migratedDatabaseImage());
  project.provide('migratedDatabaseTemplate', template);
  return () => rmSync(directory, { force: true, recursive: true });
}

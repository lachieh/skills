import { existsSync, renameSync } from 'node:fs';

/** Databases that cannot be archived (in-memory). */
export function isArchivableFileDatabase(databaseUrl: string): boolean {
  if (databaseUrl === ':memory:' || databaseUrl.includes(':memory:')) return false;
  return true;
}

function databaseFilePath(databaseUrl: string): string {
  return databaseUrl.startsWith('file:') ? databaseUrl.slice('file:'.length) : databaseUrl;
}

/**
 * Moves a diverged SQLite database (and its WAL/SHM sidecars) aside so the
 * next boot migrates from zero. Returns the archive path, or undefined for
 * in-memory databases.
 */
export function archiveDivergedDatabase(
  databaseUrl: string,
  now: Date = new Date(),
): string | undefined {
  if (!isArchivableFileDatabase(databaseUrl)) return undefined;

  const file = databaseFilePath(databaseUrl);
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const archived = `${file}.diverged-${stamp}`;

  if (existsSync(file)) renameSync(file, archived);
  for (const suffix of ['-wal', '-shm'] as const) {
    const sidecar = `${file}${suffix}`;
    if (existsSync(sidecar)) renameSync(sidecar, `${archived}${suffix}`);
  }
  return archived;
}

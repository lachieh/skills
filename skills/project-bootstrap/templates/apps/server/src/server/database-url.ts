function isInMemoryDatabaseUrl(databaseUrl: string) {
  const normalizedUrl = databaseUrl.toLowerCase();
  if (normalizedUrl === ':memory:' || normalizedUrl.startsWith('file::memory:')) return true;
  if (!normalizedUrl.startsWith('file:')) return false;

  const query = normalizedUrl.slice(normalizedUrl.indexOf('?') + 1);
  return new URLSearchParams(query).get('mode') === 'memory';
}

export function requirePersistentDatabaseUrl(value: string | undefined, context: string) {
  if (!value) {
    throw new Error(`DATABASE_URL is required ${context}.`);
  }
  if (isInMemoryDatabaseUrl(value)) {
    throw new Error(`A persistent SQLite database is required ${context}.`);
  }

  return value;
}

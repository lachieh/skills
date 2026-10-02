import path from 'node:path';

export const uploadedMediaPathPrefix = '/media/uploads/';

const uploadedMediaFileNamePattern = /^[a-f0-9]{64}\.(jpg|png|webp)$/;

export const uploadedMediaContentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function sqliteFilePath(databaseUrl: string): string {
  const withoutScheme = databaseUrl.startsWith('file:')
    ? databaseUrl.slice('file:'.length)
    : databaseUrl;
  const queryStart = withoutScheme.indexOf('?');
  return queryStart === -1 ? withoutScheme : withoutScheme.slice(0, queryStart);
}

/**
 * Uploaded uploaded files live beside the SQLite file unless MEDIA_STORAGE_DIR
 * names another directory, so a deployment that keeps its database keeps its
 * images with it.
 */
export function resolveMediaStorageDirectory(env: {
  MEDIA_STORAGE_DIR?: string;
  DATABASE_URL?: string;
}): string {
  if (env.MEDIA_STORAGE_DIR) return path.resolve(env.MEDIA_STORAGE_DIR);
  if (!env.DATABASE_URL) {
    throw new Error('MEDIA_STORAGE_DIR or DATABASE_URL is required to store uploaded media.');
  }
  return path.resolve(path.dirname(sqliteFilePath(env.DATABASE_URL)), 'media');
}

/**
 * Maps a request path under /media/uploads/ to the stored file name, or
 * undefined when the path is not a content-hash file name this server wrote.
 */
export function uploadedMediaFileName(pathname: string): string | undefined {
  if (!pathname.startsWith(uploadedMediaPathPrefix)) return undefined;
  const name = pathname.slice(uploadedMediaPathPrefix.length);
  return uploadedMediaFileNamePattern.test(name) ? name : undefined;
}

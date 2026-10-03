// The production process, and the process the e2e fixture spawns.
//
// Blocks tagged `[module: …]` belong to an optional module. Delete each block
// whose module the project did not select, together with its imports:
//
//   agent-readable surfaces  runtime/derived-surfaces, server/derived-surface-responses,
//                            server/content-negotiation, withDiscoveryHeaders
//   MCP door                 server/mcp
//   operator API             server/operator-resource-api
//   Auth                     server/auth, server/auth-edge, server/client-address,
//                            loadAuthConfig and the client-address block
//
// `server/auth-edge` exports `getBetterAuthRequestHandler(run)`, which resolves
// the auth instance from the runtime and returns `auth.handler`. Delete the
// media-storage import and `serveUploadedMedia` when the project stores no
// uploaded files.

import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { Readable } from 'node:stream';

import { ConfigProvider, Effect, Layer } from 'effect';

import { AuthConfig, ServerConfig, loadAuthConfig } from './src/runtime/config';
import {
  DerivedSurfaceUnavailable,
  loadDerivedSurfaceHandlerEffect,
} from './src/runtime/derived-surfaces';
import type { DerivedSurfaceHandler } from './src/runtime/derived-surfaces';
import { createServerOwner } from './src/runtime/owner-resources';
import { createServerRuntime, runServerEffectWithOwner } from './src/runtime/server-effect';
import { startServerDatabase } from './src/runtime/server-lifecycle';
import { authClientIpHeaderNames } from './src/server/auth';
import { isTrustedProxy, parseCidrList } from './src/server/client-address';
import { preferredRepresentation } from './src/server/content-negotiation';
import {
  notFoundMarkdownResponse,
  type DerivedSurfaceRequest,
} from './src/server/derived-surface-responses';
import { getMcpRequestHandler, getMcpServerCard } from './src/server/mcp';
import {
  resolveMediaStorageDirectory,
  uploadedMediaContentTypes,
  uploadedMediaFileName,
} from './src/server/media-storage';
import {
  getOperatorResourceRequestHandler,
  handlesOperatorResourcePath,
} from './src/server/operator-resource-api';
import { getBetterAuthRequestHandler } from './src/server/auth-edge';

const config = await startServerDatabase();
const configProvider = ConfigProvider.fromEnv();
const sourceRuntimeOwner = createServerRuntime({
  config: Layer.succeed(ServerConfig, config),
});
const disposeSourceRuntime = () => {
  void sourceRuntimeOwner.dispose().catch((error: unknown) => {
    console.error('[<project>] source runtime disposal failed', error);
  });
};
const runSourceEffect = runServerEffectWithOwner(sourceRuntimeOwner);

// Which reverse proxies may speak for their client. Empty means none, which
// keys every request on its own socket address: safe, but a proxied deployment
// must declare its proxy here or all its callers share one rate-limit bucket.
const trustedProxyMatchers = parseCidrList(
  (
    await runSourceEffect(
      loadAuthConfig.pipe(Effect.provideService(ConfigProvider.ConfigProvider, configProvider)),
    )
  ).trustedProxyCidrs,
);

const DERIVED_SURFACE_HANDLER = Symbol('derived-surface-handler');

/**
 * The derived surfaces are built against the source owner's own connection, so
 * they are cached against that owner. Keying on `databaseUrl` would be wrong:
 * two owners configured identically still hold different connections, and the
 * first one to build would answer for both.
 */
function getDerivedSurfaceHandler(): Promise<DerivedSurfaceHandler> {
  return createServerOwner(runSourceEffect).own(
    DERIVED_SURFACE_HANDLER,
    loadDerivedSurfaceHandlerEffect(),
  );
}

// @ts-expect-error The TanStack build generates this module during `vite build`.
const { default: app } = await import('./dist/server/server.js');

const assetDirectory = path.resolve(import.meta.dirname, 'dist/client/assets');
const clientDirectory = path.resolve(import.meta.dirname, 'dist/client');
const mediaDirectory = resolveMediaStorageDirectory({
  DATABASE_URL: config.databaseUrl,
  MEDIA_STORAGE_DIR: config.mediaStorageDirectory,
});
const assetContentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveAsset(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  pathname: string,
) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET') || !pathname.startsWith('/assets/')) {
    return false;
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname.slice('/assets/'.length));
  } catch {
    response.writeHead(400).end();
    return true;
  }

  const filePath = path.resolve(assetDirectory, decodedPath);
  if (!filePath.startsWith(`${assetDirectory}${path.sep}`)) {
    response.writeHead(404).end();
    return true;
  }

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': contents.byteLength,
      'Content-Type': assetContentTypes[path.extname(filePath)] ?? 'application/octet-stream',
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    response.writeHead(404).end();
  }

  return true;
}

async function serveImmutableFile(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  filePath: string,
  contentType: string | undefined,
) {
  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': contents.byteLength,
      'Content-Type': contentType ?? 'application/octet-stream',
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    response.writeHead(404).end();
  }
}

async function serveUploadedMedia(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  pathname: string,
) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) return false;
  const fileName = uploadedMediaFileName(pathname);
  if (!fileName) return false;
  await serveImmutableFile(
    request,
    response,
    path.join(mediaDirectory, fileName),
    uploadedMediaContentTypes[path.extname(fileName)],
  );
  return true;
}

async function servePublicFile(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  pathname: string,
) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET') || pathname === '/') return false;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const filePath = path.resolve(clientDirectory, decodedPath.slice(1));
  if (!filePath.startsWith(`${clientDirectory}${path.sep}`)) return false;

  try {
    const contents = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': assetContentTypes[path.extname(filePath)] ?? 'application/octet-stream',
      'Content-Length': contents.byteLength,
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
    return true;
  } catch {
    return false;
  }
}

function forwardedOrigin(headers: Headers): string {
  const first = (value: string | null) => value?.split(',')[0]?.trim() || undefined;
  const protocol = first(headers.get('x-forwarded-proto')) ?? 'http';
  const host = first(headers.get('x-forwarded-host')) ?? headers.get('host') ?? '127.0.0.1';
  return `${protocol}://${host}`;
}

const DISCOVERY_LINK_HEADER = [
  '</sitemap.xml>; rel="sitemap"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</llms.txt>; rel="llms-txt"; type="text/markdown"',
].join(', ');

function withDiscoveryHeaders(webResponse: Response): Response {
  const headers = new Headers(webResponse.headers);
  headers.append('Vary', 'Accept');
  headers.append('Link', DISCOVERY_LINK_HEADER);
  return new Response(webResponse.body, { status: webResponse.status, headers });
}

async function respondWithWeb(response: import('node:http').ServerResponse, webResponse: Response) {
  const headers: Record<string, string | string[]> = Object.fromEntries(
    webResponse.headers.entries(),
  );
  // `Headers.entries()` folds repeated Set-Cookie values into one
  // comma-joined string, and `Expires` contains commas of its own, so
  // sign-in and sign-out cookies would arrive corrupted. Forward them as the
  // separate headers they are.
  const setCookies = webResponse.headers.getSetCookie();
  if (setCookies.length > 0) headers['set-cookie'] = setCookies;
  response.writeHead(webResponse.status, headers);
  if (!webResponse.body) {
    response.end();
    return;
  }

  const reader = webResponse.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    response.write(chunk.value);
  }
  response.end();
}

async function handleRequest(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
): Promise<void> {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  // The rate limiter keys on a client address, so which address that is decides
  // whether the throttle can be walked around. Forwarded headers are believed
  // only when the immediate peer is a proxy the operator declared; otherwise
  // they are discarded and this socket's own address is authoritative. A
  // directly reachable client that sets its own `x-forwarded-for` therefore
  // cannot mint a fresh bucket per request.
  const peerAddress = request.socket.remoteAddress;
  if (isTrustedProxy(peerAddress, trustedProxyMatchers)) {
    if (!authClientIpHeaderNames.some((name) => headers.has(name)) && peerAddress) {
      headers.set('x-forwarded-for', peerAddress);
    }
  } else {
    for (const name of authClientIpHeaderNames) headers.delete(name);
    if (peerAddress) headers.set('x-forwarded-for', peerAddress);
  }

  const url = new URL(request.url ?? '/', forwardedOrigin(headers));
  const representation = preferredRepresentation(headers.get('accept'));
  if (representation === 'markdown') headers.set('accept', 'text/html');
  const hasBody = !['GET', 'HEAD'].includes(request.method ?? 'GET');
  const webRequest = new Request(url, {
    method: request.method,
    headers,
    body: hasBody ? (Readable.toWeb(request) as unknown as ReadableStream) : undefined,
    duplex: 'half',
  } as RequestInit);
  if (await serveAsset(request, response, url.pathname)) return;
  if (await serveUploadedMedia(request, response, url.pathname)) return;
  if (await servePublicFile(request, response, url.pathname)) return;

  // [module: agent-readable surfaces]
  if ((request.method ?? 'GET') === 'GET') {
    const derivedSurfaceRequest: DerivedSurfaceRequest = {
      method: request.method ?? 'GET',
      pathname: url.pathname,
      origin: url.origin,
      searchParams: url.searchParams,
      representation,
    };
    const surfaceResponse = await runSourceEffect(
      (await getDerivedSurfaceHandler())(derivedSurfaceRequest),
    );
    if (surfaceResponse) {
      response.writeHead(
        surfaceResponse.status,
        Object.fromEntries(surfaceResponse.headers.entries()),
      );
      response.end(await surfaceResponse.text());
      return;
    }
  }

  // [module: MCP door]
  if (url.pathname === '/mcp') {
    await respondWithWeb(response, await getMcpRequestHandler(runSourceEffect)(webRequest));
    return;
  }

  if (url.pathname === '/.well-known/mcp/server-card.json') {
    await respondWithWeb(
      response,
      Response.json(await getMcpServerCard(url.origin, runSourceEffect), {
        headers: { 'Cache-Control': 'public, max-age=300' },
      }),
    );
    return;
  }

  // [module: operator API] The operator REST resource API the CLI drives. Its unauthenticated index
  // publishes the contract; every resource behind it needs a bearer token.
  if (handlesOperatorResourcePath(url.pathname)) {
    await respondWithWeb(
      response,
      await getOperatorResourceRequestHandler(runSourceEffect)(webRequest),
    );
    return;
  }

  // [module: Auth]
  if (url.pathname === '/api/auth' || url.pathname.startsWith('/api/auth/')) {
    await respondWithWeb(response, await getBetterAuthRequestHandler(runSourceEffect)(webRequest));
    return;
  }

  // [module: MCP door] RFC 9728 protected-resource metadata is served by the mcp plugin off the
  // root well-known path, so MCP clients can discover the /mcp resource.
  if (url.pathname === '/.well-known/oauth-protected-resource') {
    await respondWithWeb(response, await getBetterAuthRequestHandler(runSourceEffect)(webRequest));
    return;
  }

  const webResponse = await app.fetch(webRequest);

  if (representation === 'markdown' && webResponse.status === 404) {
    await respondWithWeb(response, notFoundMarkdownResponse(url.origin));
    return;
  }

  await respondWithWeb(response, withDiscoveryHeaders(webResponse));
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch((error: unknown) => {
    console.error('[<project>] request failed', error);
    if (response.headersSent) {
      response.destroy();
      return;
    }
    if (error instanceof DerivedSurfaceUnavailable) {
      response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'service-unavailable' }));
      return;
    }
    response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'internal-server-error' }));
  });
});

server.listen(config.port, config.host, () => {
  const address = server.address();
  if (!address || typeof address === 'string') return;

  console.log(`<Project> server listening at http://${address.address}:${address.port}`);
});

let closing = false;
function beginShutdown(): void {
  if (closing) return;
  closing = true;
  server.closeIdleConnections();
  server.close((error) => {
    if (error) console.error(`[<project>] graceful shutdown failed: ${error.message}`);
    disposeSourceRuntime();
  });
  setTimeout(() => {
    server.closeAllConnections();
    // A stubborn upgraded connection must not retain the SQLite owner.
    disposeSourceRuntime();
  }, 1_000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, beginShutdown);
}

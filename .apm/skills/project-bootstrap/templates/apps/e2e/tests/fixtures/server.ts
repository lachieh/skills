import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { createDatabase, migrateDatabase } from '<scope>/db';
import { test as base, expect, type Locator } from '@playwright/test';

const serverDirectory = path.resolve(import.meta.dirname, '../../../server');

/**
 * TanStack Start hydrates asynchronously after `load`, and typing into a
 * controlled input before hydration finishes gets wiped when React syncs the
 * DOM. Filling stays sticky by re-applying the value until the control reports
 * it back.
 */
export async function fillSticky(input: Locator, value: string) {
  await expect(async () => {
    await input.fill(value);
    await expect(input).toHaveValue(value, { timeout: 500 });
  }).toPass();
}

async function waitForServer(process: ChildProcess) {
  const deadline = Date.now() + 30_000;
  let output = '';
  const collect = (chunk: Buffer) => {
    output += chunk.toString();
  };
  process.stdout?.on('data', collect);
  process.stderr?.on('data', collect);

  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Server exited before becoming ready (code ${process.exitCode}).\n${output}`);
    }
    // The line server-entry.ts logs once it is listening.
    const match = output.match(/server listening at (http:\/\/\S+)/);
    if (match) {
      try {
        if ((await fetch(match[1])).ok) return match[1];
      } catch {
        // The server is still starting.
      }
    }
    await delay(100);
  }
  throw new Error(`Server did not become ready within 30 seconds.\n${output}`);
}

async function stopServer(process: ChildProcess) {
  if (process.exitCode !== null) return;
  process.kill('SIGTERM');
  await Promise.race([once(process, 'exit'), delay(5_000)]);
  if (process.exitCode === null) {
    process.kill('SIGKILL');
    await once(process, 'exit');
  }
}

type WorkerFixtures = {
  /** The base URL of this worker's own server, on its own database. */
  serverUrl: string;
};

export const test = base.extend<{}, WorkerFixtures>({
  serverUrl: [
    async ({}, use) => {
      await access(path.join(serverDirectory, 'dist/server/server.js'));
      const directory = await mkdtemp(path.join(tmpdir(), '<cookie>-e2e-'));
      const databaseUrl = path.join(directory, 'e2e.db');

      // Seed before the server opens the file: migrate, then run the scenarios
      // from `<scope>/db/testing` the specs rely on.
      const connection = createDatabase(databaseUrl);
      migrateDatabase(connection.database);
      connection.close();

      const server = spawn('nub', ['--cwd', serverDirectory, 'server-entry.ts'], {
        cwd: serverDirectory,
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
          HOST: '127.0.0.1',
          PORT: '0',
          // Specs reach the server from loopback and supply a client address
          // per browser context, so loopback is the trusted proxy here.
          TRUSTED_PROXY_CIDRS: '127.0.0.1/32,::1/128',
          // Many browser contexts sign in against one server; the real
          // throttle would make a parallel run order-dependent. It is proven
          // in a Vitest test against the auth router instead.
          RATE_LIMIT_ENABLED: 'false',
        },
        stdio: 'pipe',
      });

      try {
        await use(await waitForServer(server));
      } finally {
        await stopServer(server);
        await rm(directory, { force: true, recursive: true });
      }
    },
    { scope: 'worker' },
  ],
});

export { expect };

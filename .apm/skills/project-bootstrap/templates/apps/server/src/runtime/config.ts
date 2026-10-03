import {
  Config,
  ConfigProvider,
  Context,
  Data,
  Effect,
  Layer,
  Option,
  Redacted,
} from 'effect';

import { requirePersistentDatabaseUrl } from '../server/database-url.js';

export type ServerConfigValue = {
  readonly databaseUrl: string;
  readonly databaseAutoReset: 'on' | 'off';
  readonly host: string;
  readonly mediaStorageDirectory: string | undefined;
  readonly nodeEnvironment: string;
  readonly port: number;
};

export class ServerConfigUnavailable extends Data.TaggedError('ServerConfigUnavailable') {}

export class AuthConfigUnavailable extends Data.TaggedError('AuthConfigUnavailable') {}

export class McpConfigUnavailable extends Data.TaggedError('McpConfigUnavailable') {}

export class ServerConfig extends Context.Service<ServerConfig, ServerConfigValue>()(
  '<scope>/ServerConfig',
) {}

export type AuthConfigValue = {
  readonly origin: string;
  readonly secret: Redacted.Redacted<string> | undefined;
  /**
   * CIDR ranges of reverse proxies whose forwarded client-address headers may
   * be believed. A request arriving from any other peer is keyed on its own TCP
   * address instead, so a client cannot mint a fresh rate-limit bucket by
   * sending its own `x-forwarded-for`. Empty means "no proxy is trusted", which
   * is the safe default and also throttles every proxied caller together, so a
   * proxied deployment must set this.
   */
  readonly trustedProxyCidrs: readonly string[];
  /**
   * Whether credential attempts are throttled. On by default in every
   * environment, including development: an unthrottled run is an unthrottled
   * one. The browser suite turns it off because a real three-per-ten-seconds
   * budget makes a large parallel run order-dependent, and it proves the
   * throttle directly instead.
   */
  readonly rateLimitEnabled: boolean;
};

export class AuthConfig extends Context.Service<AuthConfig, AuthConfigValue>()(
  '<scope>/AuthConfig',
) {}

export type McpConfigValue = {
  readonly allowedHosts: string;
  readonly allowedOrigins: string;
};

export class McpConfig extends Context.Service<McpConfig, McpConfigValue>()('<scope>/McpConfig') {}

export const loadServerConfig: Effect.Effect<
  ServerConfigValue,
  ServerConfigUnavailable
> = Effect.gen(function* () {
  const databaseUrl = yield* Config.String('DATABASE_URL');
  const databaseAutoReset = yield* Config.Literals(['on', 'off'], 'DATABASE_AUTO_RESET').pipe(
    Config.withDefault('on'),
  );
  const nodeEnvironment = yield* Config.String('NODE_ENV').pipe(Config.withDefault('development'));
  const betterAuthSecret = yield* Config.option(Config.Redacted('BETTER_AUTH_SECRET')).pipe(
    Config.map(Option.filter((secret) => Redacted.value(secret).trim().length > 0)),
  );
  const port = yield* Config.String('PORT').pipe(Config.withDefault('3000'));
  const host = yield* Config.String('HOST').pipe(Config.withDefault('127.0.0.1'));
  const mediaStorageDirectory = yield* Config.option(Config.String('MEDIA_STORAGE_DIR')).pipe(
    Config.map(Option.filter((value) => value.trim().length > 0)),
  );

  return yield* Effect.try({
    try: (): ServerConfigValue => {
      const parsedPort = Number(port);
      if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65_535) {
        throw new TypeError('PORT must be an integer from 0 through 65535.');
      }
      return {
        databaseUrl: requirePersistentDatabaseUrl(databaseUrl, 'for the server runtime'),
        databaseAutoReset,
        host,
        mediaStorageDirectory: Option.getOrUndefined(mediaStorageDirectory),
        nodeEnvironment,
        port: parsedPort,
      };
    },
    catch: () => new ServerConfigUnavailable(),
  }).pipe(
    Effect.flatMap((config) =>
      nodeEnvironment === 'production' && Option.isNone(betterAuthSecret)
        ? Effect.fail(new ServerConfigUnavailable())
        : Effect.succeed(config),
    ),
  );
}).pipe(Effect.mapError(() => new ServerConfigUnavailable()));

export const loadAuthConfig: Effect.Effect<
  AuthConfigValue,
  AuthConfigUnavailable
> = Effect.gen(function* () {
  const appUrl = yield* Config.option(Config.String('APP_URL')).pipe(
    Config.map(Option.filter((value) => value.trim().length > 0)),
  );
  const betterAuthUrl = yield* Config.option(Config.String('BETTER_AUTH_URL')).pipe(
    Config.map(Option.filter((value) => value.trim().length > 0)),
  );
  const secret = yield* Config.option(Config.Redacted('BETTER_AUTH_SECRET')).pipe(
    Config.map(Option.filter((value) => Redacted.value(value).trim().length > 0)),
  );
  const origin = (
    Option.getOrUndefined(appUrl) ??
    Option.getOrUndefined(betterAuthUrl) ??
    'http://localhost:3000'
  ).replace(/\/+$/, '');

  // Comma-separated CIDR list. An unparseable entry is rejected by the address
  // matcher at use rather than silently ignored: trusting nothing is safe, but
  // believing the wrong range is not.
  const trustedProxyCidrs = yield* Config.String('TRUSTED_PROXY_CIDRS').pipe(
    Config.withDefault(''),
    Config.map((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );

  const rateLimitEnabled = yield* Config.Literals(['true', 'false'], 'RATE_LIMIT_ENABLED').pipe(
    Config.withDefault('true'),
    Config.map((value) => value === 'true'),
  );

  return yield* Effect.try({
    try: () => ({
      origin,
      secret: Option.getOrUndefined(secret),
      trustedProxyCidrs,
      rateLimitEnabled,
    }),
    catch: () => new AuthConfigUnavailable(),
  });
}).pipe(Effect.mapError(() => new AuthConfigUnavailable()));

export const loadMcpConfig: Effect.Effect<
  McpConfigValue,
  McpConfigUnavailable
> = Effect.gen(function* () {
  const allowedHosts = yield* Config.String('MCP_ALLOWED_HOSTS').pipe(Config.withDefault(''));
  const allowedOrigins = yield* Config.String('MCP_ALLOWED_ORIGINS').pipe(Config.withDefault(''));
  return { allowedHosts, allowedOrigins };
}).pipe(Effect.mapError(() => new McpConfigUnavailable()));

export function serverConfigLayer(
  configProvider: ConfigProvider.ConfigProvider = ConfigProvider.fromEnv(),
) {
  return Layer.effect(ServerConfig, loadServerConfig).pipe(
    Layer.provide(ConfigProvider.layer(configProvider)),
  );
}

export function authConfigLayer(
  configProvider: ConfigProvider.ConfigProvider = ConfigProvider.fromEnv(),
) {
  return Layer.effect(AuthConfig, loadAuthConfig).pipe(
    Layer.provide(ConfigProvider.layer(configProvider)),
  );
}

export function mcpConfigLayer(
  configProvider: ConfigProvider.ConfigProvider = ConfigProvider.fromEnv(),
) {
  return Layer.effect(McpConfig, loadMcpConfig).pipe(
    Layer.provide(ConfigProvider.layer(configProvider)),
  );
}

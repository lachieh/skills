/**
 * RFC 8628 device authorization grant, as one Effect program.
 *
 * Every device-flow caller shares this mechanism: server-side batch commands,
 * the operator CLI's `auth login`, and the e2e oracle. What each caller still owns is its *policy* — which client it
 * authenticates as, which scopes and resource it asks for, how long a person
 * has to approve, and how the approval step is presented.
 *
 * Sharing the mechanism cannot weaken authorization. It transports a grant; it
 * never decides one. The scopes a token carries are still fixed by the client
 * registration the server provisions, and the door still enforces them.
 */

import { Clock, Data, Duration, Effect } from 'effect';

/** RFC 8628 grant type, repeated verbatim at the token endpoint. */
const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

/** The provider's default poll interval when the code request omits one. */
const DEFAULT_POLL_INTERVAL = Duration.seconds(5);

/** RFC 8628 §3.5: every `slow_down` adds this to all later waits. */
const SLOW_DOWN_INCREMENT = Duration.seconds(5);

/**
 * The managed public clients this deployment registers. The list is closed on
 * purpose: adding a client is a server provisioning change, not a string that
 * happens to typecheck somewhere.
 */
export const mcpDeviceOAuthClientId = '<cookie>-mcp';
export const cliOAuthClientId = '<cookie>-cli';

const oauthClientIds = [mcpDeviceOAuthClientId, cliOAuthClientId] as const;

export type OAuthClientId = (typeof oauthClientIds)[number];

/** The human step: what the person approving has to see, and nothing else. */
export type DeviceChallenge = {
  readonly userCode: string;
  /**
   * `verification_uri_complete` if the provider sent one, else
   * `verification_uri`, else the deployment's own `/device` page carrying the
   * user code.
   */
  readonly verificationUrl: string;
};

/**
 * One access token, normalised. `expiresAt` is epoch milliseconds, and `scope`
 * is whatever the provider actually granted — which may be fewer scopes than
 * the caller asked for, and a caller that stores scopes needs to know that.
 */
export type DeviceGrantTokens = {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: number;
  readonly scope?: string;
};

/** The grant was well-formed and the person declined, or never acted. */
export class DeviceGrantDeclined extends Data.TaggedError('DeviceGrantDeclined')<{
  readonly code: string;
  readonly detail: string;
}> {}

export class DeviceGrantTimedOut extends Data.TaggedError('DeviceGrantTimedOut')<{
  readonly waitedMs: number;
}> {}

/** Something about the deployment stopped the grant before it could start. */
export class DeviceGrantRequestRefused extends Data.TaggedError('DeviceGrantRequestRefused')<{
  readonly status: number;
  readonly detail: string;
}> {}

export class DeviceGrantMalformedResponse extends Data.TaggedError('DeviceGrantMalformedResponse')<{
  readonly detail: string;
}> {}

export class DeviceGrantTransportFailed extends Data.TaggedError('DeviceGrantTransportFailed')<{
  readonly cause: unknown;
}> {}

export type DeviceGrantRefusal = DeviceGrantDeclined | DeviceGrantTimedOut;

export type DeviceGrantUnavailable =
  | DeviceGrantRequestRefused
  | DeviceGrantMalformedResponse
  | DeviceGrantTransportFailed;

export type DeviceGrantFailure = DeviceGrantRefusal | DeviceGrantUnavailable;

/** Policy the caller owns. Mechanism the module owns. */
export type DeviceGrantPolicy = {
  /** Better Auth issuer, e.g. `https://host/api/auth`. */
  readonly issuer: string;
  readonly client: OAuthClientId;
  readonly scopes: ReadonlyArray<string>;
  /** RFC 8707 resource indicator the returned token must be audience-bound to. */
  readonly resource?: string;
  /** How long a person has to approve. A duration, not a deadline. */
  readonly approveWithin: Duration.DurationInput;
  /** Fires once, as soon as the code is issued. Presentation is the caller's. */
  readonly onChallenge?: (challenge: DeviceChallenge) => Effect.Effect<void>;
};

type DeviceCodeBody = {
  readonly device_code?: string;
  readonly user_code?: string;
  readonly verification_uri?: string;
  readonly verification_uri_complete?: string;
  readonly interval?: number;
  readonly error?: string;
  readonly error_description?: string;
};

type TokenBody = {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
  readonly scope?: string;
  readonly error?: string;
  readonly error_description?: string;
};

const readJson = <A>(response: Response, malformed: string) =>
  Effect.tryPromise({
    try: () => response.json() as Promise<A>,
    catch: () => new DeviceGrantMalformedResponse({ detail: malformed }),
  });

const refuse = (body: { error?: string; error_description?: string }, status: number) =>
  new DeviceGrantRequestRefused({
    status,
    detail: body.error_description ?? body.error ?? `HTTP ${status}`,
  });

/** The deployment origin behind an issuer, for the `/device` page fallback. */
const deploymentOrigin = (issuer: string): string => issuer.replace(/\/api\/auth\/*$/, '');

/** A usable code: the two fields the flow cannot proceed without. */
type IssuedDeviceCode = {
  readonly deviceCode: string;
  readonly body: DeviceCodeBody & { readonly user_code: string };
};

const requestDeviceCode = (
  policy: DeviceGrantPolicy,
  issuer: string,
): Effect.Effect<IssuedDeviceCode, DeviceGrantFailure> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${issuer}/device/code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: policy.client,
            scope: policy.scopes.join(' '),
            ...(policy.resource === undefined ? {} : { resource: policy.resource }),
          }),
        }),
      catch: (cause) => new DeviceGrantTransportFailed({ cause }),
    }).pipe(
      Effect.flatMap((sent) =>
        readJson<DeviceCodeBody>(sent, 'The device code response was not JSON.').pipe(
          Effect.flatMap((body) =>
            sent.ok ? Effect.succeed(body) : Effect.fail(refuse(body, sent.status)),
          ),
        ),
      ),
    );
    if (!response.device_code || !response.user_code) {
      return yield* Effect.fail(
        new DeviceGrantMalformedResponse({
          detail: 'The device authorization server issued no usable device code.',
        }),
      );
    }
    return {
      deviceCode: response.device_code,
      body: { ...response, user_code: response.user_code },
    };
  });

/** What one poll of the token endpoint said. */
type TokenPoll =
  | { readonly _tag: 'Granted'; readonly tokens: DeviceGrantTokens }
  | { readonly _tag: 'Pending' }
  | { readonly _tag: 'SlowDown' };

const requestToken = (
  policy: DeviceGrantPolicy,
  issuer: string,
  deviceCode: string,
): Effect.Effect<TokenPoll, DeviceGrantFailure> =>
  Effect.gen(function* () {
    const { sent, body } = yield* Effect.tryPromise({
      try: () =>
        fetch(`${issuer}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: DEVICE_CODE_GRANT,
            device_code: deviceCode,
            client_id: policy.client,
            ...(policy.resource === undefined ? {} : { resource: policy.resource }),
          }),
        }),
      catch: (cause) => new DeviceGrantTransportFailed({ cause }),
    }).pipe(
      Effect.flatMap((sent) =>
        readJson<TokenBody>(sent, 'The device token response was not JSON.').pipe(
          Effect.flatMap((body) => Effect.succeed({ sent, body })),
        ),
      ),
    );

    if (sent.ok && body.access_token) {
      const issuedAt = yield* Clock.currentTimeMillis;
      return {
        _tag: 'Granted',
        tokens: {
          accessToken: body.access_token,
          ...(body.refresh_token === undefined ? {} : { refreshToken: body.refresh_token }),
          ...(body.expires_in === undefined
            ? {}
            : { expiresAt: issuedAt + body.expires_in * 1_000 }),
          ...(body.scope === undefined ? {} : { scope: body.scope }),
        },
      } satisfies TokenPoll;
    }
    if (body.error === 'authorization_pending') return { _tag: 'Pending' } satisfies TokenPoll;
    if (body.error === 'slow_down') return { _tag: 'SlowDown' } satisfies TokenPoll;
    // Any other OAuth error is the person declining, or the deployment
    // refusing, and it says so in the body whether or not the status agrees.
    if (body.error !== undefined) {
      return yield* Effect.fail(
        new DeviceGrantDeclined({ code: body.error, detail: body.error_description ?? body.error }),
      );
    }
    if (!sent.ok) return yield* Effect.fail(refuse(body, sent.status));
    return yield* Effect.fail(
      new DeviceGrantMalformedResponse({
        detail: 'The token response carried no access token and no error.',
      }),
    );
  });

/**
 * Requests a device code, presents it once, and polls until the person
 * approves, declines, or the approval window closes.
 *
 * Polling goes through `Effect.sleep`, so the whole wait is a function of the
 * `Clock` and a test can run the real loop on a `TestClock`.
 */
export const requestDeviceGrant = (
  policy: DeviceGrantPolicy,
): Effect.Effect<DeviceGrantTokens, DeviceGrantFailure> =>
  Effect.gen(function* () {
    const issuer = policy.issuer.replace(/\/+$/, '');
    const approveWithinMs = Duration.toMillis(policy.approveWithin);
    const code = yield* requestDeviceCode(policy, issuer);

    const origin = deploymentOrigin(issuer);
    const verificationUrl =
      code.body.verification_uri_complete ??
      code.body.verification_uri ??
      `${origin}/device?user_code=${encodeURIComponent(code.body.user_code)}`;
    if (policy.onChallenge) {
      yield* policy.onChallenge({ userCode: code.body.user_code, verificationUrl });
    }

    const startedAt = yield* Clock.currentTimeMillis;
    const deadline = startedAt + approveWithinMs;
    const providerInterval =
      code.body.interval === undefined ? undefined : Duration.seconds(code.body.interval);
    let wait =
      providerInterval === undefined || Duration.toMillis(providerInterval) === 0
        ? DEFAULT_POLL_INTERVAL
        : providerInterval;

    for (;;) {
      const now = yield* Clock.currentTimeMillis;
      if (now >= deadline) {
        return yield* Effect.fail(new DeviceGrantTimedOut({ waitedMs: now - startedAt }));
      }
      yield* Effect.sleep(wait);
      const poll = yield* requestToken(policy, issuer, code.deviceCode);
      if (poll._tag === 'Granted') return poll.tokens;
      // RFC 8628 §3.5: a `slow_down` means we are polling too fast, and every
      // later wait in this grant grows.
      if (poll._tag === 'SlowDown') wait = Duration.sum(wait, SLOW_DOWN_INCREMENT);
    }
  });

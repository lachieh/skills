/**
 * Origin assertions for the deployment smoke check, kept as pure functions so
 * the comparison logic is unit tested rather than buried in the shell that runs
 * it.
 *
 * A server started without its public origin configured still boots, still
 * serves build-hashed assets, and still answers `/api/auth/ok` — it simply
 * advertises `http://localhost:3000/api/auth` as its issuer, and every
 * same-origin authenticated write is then refused with `INVALID_ORIGIN`.
 * Comparing the served issuer against the `APP_URL` that run was given is the
 * only assertion in the smoke check that separates that deployment from a
 * correct one.
 */

/** The path Better Auth serves under, and the suffix of the issuer it stamps. */
export const authBasePath = '/api/auth';

export type ServedIssuer =
  | { readonly kind: 'issuer'; readonly issuer: string }
  | { readonly kind: 'missing-issuer' }
  | { readonly kind: 'unreadable-document' };

export type ServedAuthOriginVerdict =
  | { readonly ok: true; readonly expected: string; readonly served: string }
  | {
      readonly ok: false;
      readonly reason: 'unreadable-document' | 'missing-issuer' | 'origin-mismatch';
      readonly expected: string;
      readonly served: string;
    };

/**
 * The issuer a deployment reached at `appUrl` must advertise. The comparison
 * is against the origin the run was actually configured with, so a staging run
 * and a production run can never satisfy one another.
 */
export function expectedAuthIssuer(appUrl: string): string {
  return `${appUrl.replace(/\/+$/, '')}${authBasePath}`;
}

/**
 * Reads the issuer out of an OIDC discovery document. An absent, non-string, or
 * blank issuer is reported separately from an unparseable document so neither
 * can pass as agreement with the expected origin.
 */
export function readServedIssuer(document: string): ServedIssuer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(document) as unknown;
  } catch {
    return { kind: 'unreadable-document' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { kind: 'unreadable-document' };
  const issuer = (parsed as { issuer?: unknown }).issuer;
  if (typeof issuer !== 'string' || issuer.trim() === '') return { kind: 'missing-issuer' };
  return { kind: 'issuer', issuer };
}

/**
 * Asserts that a served discovery document advertises exactly the issuer the
 * configured `appUrl` implies. Trailing slashes on the configured origin are
 * normalized away; the served issuer is compared as written, so no tolerated
 * variation can let a wrong origin through.
 */
export function verifyServedAuthOrigin(appUrl: string, document: string): ServedAuthOriginVerdict {
  const expected = expectedAuthIssuer(appUrl);
  const served = readServedIssuer(document);
  if (served.kind === 'unreadable-document') {
    return { ok: false, reason: 'unreadable-document', expected, served: '' };
  }
  if (served.kind === 'missing-issuer') {
    return { ok: false, reason: 'missing-issuer', expected, served: '' };
  }
  if (served.issuer !== expected) {
    return { ok: false, reason: 'origin-mismatch', expected, served: served.issuer };
  }
  return { ok: true, expected, served: served.issuer };
}

export type OriginProbeResponse = {
  readonly status: number;
  readonly body: string;
};

export type OriginEnforcement =
  | { readonly outcome: 'refused-by-origin-check' }
  | { readonly outcome: 'reached-handler' }
  | { readonly outcome: 'indeterminate' };

/**
 * Classifies one probe response against the Better Auth origin check. Only a
 * `403` carrying the `INVALID_ORIGIN` code counts as the origin check refusing
 * the request; a refusal without that code is reported as indeterminate rather
 * than counted, so no unrelated rejection can stand in for origin enforcement.
 */
export function classifyOriginEnforcement(response: OriginProbeResponse): OriginEnforcement {
  if (response.status !== 403) return { outcome: 'reached-handler' };
  let code: unknown;
  try {
    code = (JSON.parse(response.body) as { code?: unknown }).code;
  } catch {
    return { outcome: 'indeterminate' };
  }
  return code === 'INVALID_ORIGIN'
    ? { outcome: 'refused-by-origin-check' }
    : { outcome: 'indeterminate' };
}

export type OriginEnforcementProbes = {
  readonly untrusted: OriginProbeResponse;
  readonly sameOrigin: OriginProbeResponse;
};

export type OriginEnforcementVerdict =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'untrusted-origin-accepted' | 'same-origin-refused' | 'indeterminate';
      readonly detail: string;
    };

/**
 * Asserts that origin validation is still narrow: a request bearing an
 * untrusted `Origin` is refused by the origin check, and a request bearing the
 * deployment's own origin reaches the handler instead of being refused with
 * everything. The positive probe is what stops a blanket refusal — a wildcard
 * trusted origin, or a disabled check wired to reject all writes — from
 * reading as enforcement.
 */
export function verifyOriginEnforcement({
  untrusted,
  sameOrigin,
}: OriginEnforcementProbes): OriginEnforcementVerdict {
  const untrustedOutcome = classifyOriginEnforcement(untrusted);
  const sameOriginOutcome = classifyOriginEnforcement(sameOrigin);
  if (
    untrustedOutcome.outcome === 'indeterminate' ||
    sameOriginOutcome.outcome === 'indeterminate'
  ) {
    return {
      ok: false,
      reason: 'indeterminate',
      detail: `untrusted probe: HTTP ${untrusted.status}; same-origin probe: HTTP ${sameOrigin.status}`,
    };
  }
  if (untrustedOutcome.outcome === 'reached-handler') {
    return { ok: false, reason: 'untrusted-origin-accepted', detail: `HTTP ${untrusted.status}` };
  }
  if (sameOriginOutcome.outcome === 'refused-by-origin-check') {
    return {
      ok: false,
      reason: 'same-origin-refused',
      detail: `HTTP ${sameOrigin.status} INVALID_ORIGIN`,
    };
  }
  return { ok: true };
}

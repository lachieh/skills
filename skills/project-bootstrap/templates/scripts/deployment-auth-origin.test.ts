import { describe, expect, it } from 'vitest';

import {
  classifyOriginEnforcement,
  expectedAuthIssuer,
  readServedIssuer,
  verifyOriginEnforcement,
  verifyServedAuthOrigin,
} from './deployment-auth-origin.ts';

const productionAppUrl = 'https://app.example';
const stagingAppUrl = 'https://staging.app.example';

function discoveryDocument(issuer: unknown): string {
  return JSON.stringify({
    issuer,
    authorization_endpoint: 'https://app.example/api/auth/authorize',
    jwks_uri: 'https://app.example/api/auth/jwks',
  });
}

describe('expectedAuthIssuer', () => {
  it('appends the auth base path to the origin the run was configured with', () => {
    expect(expectedAuthIssuer(productionAppUrl)).toBe('https://app.example/api/auth');
    expect(expectedAuthIssuer(stagingAppUrl)).toBe('https://staging.app.example/api/auth');
  });

  it('normalizes trailing slashes off the configured origin', () => {
    expect(expectedAuthIssuer(`${productionAppUrl}/`)).toBe('https://app.example/api/auth');
    expect(expectedAuthIssuer(`${productionAppUrl}///`)).toBe(
      'https://app.example/api/auth',
    );
  });

  it('never collapses two environments onto one expected issuer', () => {
    expect(expectedAuthIssuer(stagingAppUrl)).not.toBe(expectedAuthIssuer(productionAppUrl));
  });
});

describe('readServedIssuer', () => {
  it('reads a string issuer', () => {
    expect(readServedIssuer(discoveryDocument('https://app.example/api/auth'))).toEqual({
      kind: 'issuer',
      issuer: 'https://app.example/api/auth',
    });
  });

  it.each([
    { name: 'an absent issuer', document: JSON.stringify({ jwks_uri: 'x' }) },
    { name: 'a null issuer', document: discoveryDocument(null) },
    { name: 'a blank issuer', document: discoveryDocument('   ') },
    { name: 'an empty issuer', document: discoveryDocument('') },
    { name: 'a non-string issuer', document: discoveryDocument(42) },
  ])('reports $name as a missing issuer rather than agreement', ({ document }) => {
    expect(readServedIssuer(document)).toEqual({ kind: 'missing-issuer' });
  });

  it.each([
    { name: 'an empty body', document: '' },
    { name: 'a truncated body', document: '{"issuer":' },
    { name: 'a JSON scalar', document: '"https://app.example/api/auth"' },
    { name: 'a JSON null', document: 'null' },
  ])('reports $name as an unreadable document', ({ document }) => {
    expect(readServedIssuer(document)).toEqual({ kind: 'unreadable-document' });
  });
});

describe('verifyServedAuthOrigin', () => {
  it('accepts a discovery document whose issuer is the configured origin', () => {
    expect(
      verifyServedAuthOrigin(
        productionAppUrl,
        discoveryDocument('https://app.example/api/auth'),
      ),
    ).toEqual({
      ok: true,
      expected: 'https://app.example/api/auth',
      served: 'https://app.example/api/auth',
    });
  });

  it('rejects the localhost issuer a misconfigured deployment advertises', () => {
    const verdict = verifyServedAuthOrigin(
      productionAppUrl,
      discoveryDocument('http://localhost:3000/api/auth'),
    );

    expect(verdict).toEqual({
      ok: false,
      reason: 'origin-mismatch',
      expected: 'https://app.example/api/auth',
      served: 'http://localhost:3000/api/auth',
    });
  });

  it('rejects another environment issuer even when the origin is otherwise right', () => {
    expect(
      verifyServedAuthOrigin(
        productionAppUrl,
        discoveryDocument('https://staging.app.example/api/auth'),
      ),
    ).toMatchObject({ ok: false, reason: 'origin-mismatch' });
    expect(
      verifyServedAuthOrigin(
        stagingAppUrl,
        discoveryDocument('https://app.example/api/auth'),
      ),
    ).toMatchObject({ ok: false, reason: 'origin-mismatch' });
  });

  it('accepts the localhost issuer when the run was itself configured for localhost', () => {
    expect(
      verifyServedAuthOrigin(
        'http://localhost:3000',
        discoveryDocument('http://localhost:3000/api/auth'),
      ),
    ).toMatchObject({ ok: true, served: 'http://localhost:3000/api/auth' });
  });

  it('normalizes a trailing slash on the configured origin before comparing', () => {
    expect(
      verifyServedAuthOrigin(
        `${productionAppUrl}/`,
        discoveryDocument('https://app.example/api/auth'),
      ),
    ).toMatchObject({ ok: true });
  });

  it('does not tolerate a trailing slash on the served issuer', () => {
    expect(
      verifyServedAuthOrigin(
        productionAppUrl,
        discoveryDocument('https://app.example/api/auth/'),
      ),
    ).toMatchObject({ ok: false, reason: 'origin-mismatch' });
  });

  it.each([
    { name: 'an absent issuer', document: JSON.stringify({ jwks_uri: 'x' }) },
    { name: 'a blank issuer', document: discoveryDocument('') },
  ])('fails rather than passing vacuously on $name', ({ document }) => {
    expect(verifyServedAuthOrigin(productionAppUrl, document)).toMatchObject({
      ok: false,
      reason: 'missing-issuer',
      expected: 'https://app.example/api/auth',
      served: '',
    });
  });

  it('fails on an unreadable document', () => {
    expect(verifyServedAuthOrigin(productionAppUrl, '<html>gateway error</html>')).toMatchObject({
      ok: false,
      reason: 'unreadable-document',
    });
  });
});

describe('classifyOriginEnforcement', () => {
  it('counts a 403 carrying INVALID_ORIGIN as the origin check refusing', () => {
    expect(
      classifyOriginEnforcement({
        status: 403,
        body: JSON.stringify({ code: 'INVALID_ORIGIN', message: 'Invalid origin' }),
      }),
    ).toEqual({ outcome: 'refused-by-origin-check' });
  });

  it('treats a rejection without the origin code as indeterminate', () => {
    expect(
      classifyOriginEnforcement({
        status: 403,
        body: JSON.stringify({ code: 'FORBIDDEN', message: 'Forbidden' }),
      }),
    ).toEqual({ outcome: 'indeterminate' });
    expect(classifyOriginEnforcement({ status: 403, body: 'not json' })).toEqual({
      outcome: 'indeterminate',
    });
  });

  it('treats any handler-level response as the origin check letting the request through', () => {
    expect(
      classifyOriginEnforcement({
        status: 401,
        body: JSON.stringify({ code: 'INVALID_USERNAME_OR_PASSWORD' }),
      }),
    ).toEqual({ outcome: 'reached-handler' });
  });
});

describe('verifyOriginEnforcement', () => {
  const refused = {
    status: 403,
    body: JSON.stringify({ code: 'INVALID_ORIGIN', message: 'Invalid origin' }),
  };
  const handled = {
    status: 401,
    body: JSON.stringify({ code: 'INVALID_USERNAME_OR_PASSWORD' }),
  };

  it('accepts an untrusted origin refused while the configured origin is handled', () => {
    expect(verifyOriginEnforcement({ untrusted: refused, sameOrigin: handled })).toEqual({
      ok: true,
    });
  });

  it('fails when a wildcard trusted origin lets the untrusted request through', () => {
    expect(verifyOriginEnforcement({ untrusted: handled, sameOrigin: handled })).toMatchObject({
      ok: false,
      reason: 'untrusted-origin-accepted',
    });
  });

  it('fails when the deployment refuses its own origin', () => {
    expect(verifyOriginEnforcement({ untrusted: refused, sameOrigin: refused })).toMatchObject({
      ok: false,
      reason: 'same-origin-refused',
    });
  });

  it('fails when either probe is indeterminate rather than assuming enforcement', () => {
    expect(
      verifyOriginEnforcement({
        untrusted: { status: 403, body: 'not json' },
        sameOrigin: handled,
      }),
    ).toMatchObject({ ok: false, reason: 'indeterminate' });
    expect(
      verifyOriginEnforcement({
        untrusted: refused,
        sameOrigin: { status: 403, body: 'not json' },
      }),
    ).toMatchObject({ ok: false, reason: 'indeterminate' });
  });
});

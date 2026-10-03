/**
 * Command-line surface over the deployment origin assertions, so the shell
 * smoke check runs the same logic the unit tests cover. Reads a JSON payload on
 * stdin and exits non-zero with a GitHub Actions `::error::` annotation when the
 * assertion does not hold.
 *
 *   assert-deployment-auth-origin.ts issuer --app-url <url>            # OIDC discovery document
 *   assert-deployment-auth-origin.ts origin-enforcement --app-url <url> # { untrusted, sameOrigin } probes
 */
import {
  expectedAuthIssuer,
  verifyOriginEnforcement,
  verifyServedAuthOrigin,
  type OriginEnforcementProbes,
} from './deployment-auth-origin.ts';

function fail(message: string): never {
  console.error(`::error::${message}`);
  process.exit(1);
}

function readOption(name: string): string {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) fail(`Missing ${name} argument.`);
  return process.argv[index + 1] as string;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function parseProbes(payload: string): OriginEnforcementProbes {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return fail('Origin enforcement payload was not readable JSON.');
  }
  const probes = parsed as Partial<OriginEnforcementProbes> | null;
  for (const name of ['untrusted', 'sameOrigin'] as const) {
    const probe = probes?.[name];
    if (
      typeof probe?.status !== 'number' ||
      typeof probe?.body !== 'string' ||
      !Number.isFinite(probe.status)
    ) {
      fail(`Origin enforcement payload is missing a usable ${name} probe.`);
    }
  }
  return {
    untrusted: probes?.untrusted as OriginEnforcementProbes['untrusted'],
    sameOrigin: probes?.sameOrigin as OriginEnforcementProbes['sameOrigin'],
  };
}

const command = process.argv[2];
const appUrl = readOption('--app-url');

if (command === 'issuer') {
  const verdict = verifyServedAuthOrigin(appUrl, await readStdin());
  if (!verdict.ok) {
    fail(
      `The deployed authentication origin is not the configured one (${verdict.reason}). ` +
        `APP_URL names ${verdict.expected} but the deployment advertises ` +
        `${verdict.served === '' ? 'no issuer' : verdict.served}. ` +
        'Set APP_URL on this deployment environment; do not relax origin validation.',
    );
  }
  console.log(`Served authentication origin is ${verdict.served}.`);
} else if (command === 'origin-enforcement') {
  const verdict = verifyOriginEnforcement(parseProbes(await readStdin()));
  if (!verdict.ok) {
    fail(
      `Origin validation is not behaving as deployed (${verdict.reason}: ${verdict.detail}). ` +
        `An untrusted Origin must still be refused and the ${appUrl} origin must still be accepted.`,
    );
  }
  console.log('Untrusted origin refused and configured origin accepted.');
} else {
  console.error(`::error::Unknown command: ${String(command)}`);
  process.exit(1);
}

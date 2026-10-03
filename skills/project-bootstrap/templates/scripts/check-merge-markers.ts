/**
 * Fails when a tracked file still carries an unresolved merge-conflict marker.
 *
 * Two documentation artifacts reached `main` with conflict markers spliced into
 * them, and every existing gate passed: oxfmt and oxlint do not read Markdown,
 * and the Effect audit only understands TypeScript. This check closes that gap.
 *
 * It scans every tracked file rather than a list of extensions. An extension
 * allowlist is the wrong shape: it misses any file type nobody thought to add,
 * which is exactly how a marker survived in a `.html` prototype while this check
 * reported success. Binary content is skipped by looking for a NUL byte, so the
 * denylist is not needed and a new file type is covered by default.
 */

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

import { detectConflictMarkers, looksBinary } from './conflict-markers';

const selfProbe = (): void => {
  const conflicted = [
    'diff --git a/x b/x',
    '<<<<<<< Updated upstream',
    'a',
    '=======',
    'b',
    '||||||| Stash base',
    '>>>>>>> Stashed changes',
  ].join('\n');
  // The shape that actually reached `main`: the opener glued to a header, with
  // no matching closer anywhere in the file.
  const spliced = ['# Title', '<<<<<<< Updated upstream **Ticket:** #1', 'body', 'more body'].join(
    '\n',
  );
  // The shape oxfmt leaves after parsing markers as Markdown syntax.
  const reformatted = [
    '|     |     |     |     |     |     | Stash base |',
    '| ======= |',
    '> > > > > > > Stashed changes',
  ].join('\n');
  const clean = [
    '# Title',
    '',
    'Setext heading',
    '=======',
    '',
    'const marker = ">>>>>>> not a marker";',
  ].join('\n');

  if (detectConflictMarkers(conflicted).length !== 3) {
    throw new Error('self-probe failed: did not detect a full conflict block');
  }
  if (detectConflictMarkers(spliced).length !== 1) {
    throw new Error('self-probe failed: did not detect a spliced conflict');
  }
  if (detectConflictMarkers(reformatted).length !== 3) {
    throw new Error('self-probe failed: did not detect formatter-rewritten markers');
  }
  if (detectConflictMarkers(clean).length !== 0) {
    throw new Error('self-probe false positive: flagged a clean document');
  }
  if (!looksBinary(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))) {
    throw new Error('self-probe failed: did not recognise binary content');
  }
  if (looksBinary(Buffer.from('plain text', 'utf8'))) {
    throw new Error('self-probe false positive: treated text as binary');
  }
};

const trackedFiles = (): string[] =>
  execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter((file) => file.length > 0);

const main = async (): Promise<void> => {
  selfProbe();

  const offenders: string[] = [];
  for (const file of trackedFiles()) {
    let contents: Buffer;
    try {
      contents = await readFile(file);
    } catch {
      // A file that disappeared or is unreadable is not a marker problem.
      continue;
    }
    if (looksBinary(contents)) continue;
    const lines = detectConflictMarkers(contents.toString('utf8'));
    if (lines.length > 0) offenders.push(`${file}:${lines.join(',')}`);
  }

  if (offenders.length > 0) {
    console.error('Merge-conflict markers found in tracked files:\n');
    for (const offender of offenders) console.error(`  ${offender}`);
    console.error('\nResolve the conflict and commit the resolved content.');
    process.exit(1);
  }

  console.log('Merge-conflict marker check passed.');
};

await main();

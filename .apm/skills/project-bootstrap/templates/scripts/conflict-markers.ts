/**
 * Conflict-marker detection, kept separate from the script that walks the
 * repository so it can be unit tested against synthetic input.
 */

/**
 * A conflict marker is a line-initial run of at least seven characters. A bare
 * `=======` is deliberately not matched: it is a legitimate Markdown setext
 * underline, and a stray separator without an opener is not a conflict.
 */
const conflictMarker = /^(?:<{7} |\|{7} |>{7} )/;

/**
 * A marker glued into the middle of a line. Reflowing prose joins a marker
 * onto its neighbours — a base marker and separator landing between two
 * sentences — so a line-initial check never sees it. The run must stand alone between
 * whitespace or line edges, which keeps quoted strings such as
 * `">>>>>>> not a marker"` and inline code out of it.
 */
const inlineConflictMarker = /(?:^|\s)(?:<{7}|\|{7}|>{7})(?=\s|$)/;

/**
 * The shapes a Markdown formatter turns markers into once it has parsed them
 * as syntax rather than text. Each is a form that actually reached `main`:
 *
 * - `>>>>>>> label` read as seven nested blockquotes: `> > > > > > > label`.
 *   A seven-deep quote is not something anyone writes on purpose.
 * - `||||||| label` read as a table row of six empty cells followed by the
 *   label, then padded: `|     |     | ... | Stash base |`.
 * - `=======` directly under a table read as a one-cell row: `| ======= |`.
 * - Any table row carrying one of git's stash-conflict labels as a cell.
 */
const reformattedConflictMarkers: readonly RegExp[] = [
  /^(?:> ?){6}>(?:\s|$)/,
  /^\|(?:[ \t]*\|){6}[ \t]*[^\s|]/,
  /^\|[ \t]*={7}[ \t]*\|(?:[ \t]*\|)*[ \t]*$/,
  /^\|(?:.*\|)?[ \t]*(?:Updated upstream|Stashed changes|Stash base)[ \t]*\|/,
];

const isConflictMarker = (line: string): boolean =>
  conflictMarker.test(line) ||
  inlineConflictMarker.test(line) ||
  reformattedConflictMarkers.some((pattern) => pattern.test(line));

/** 1-based line numbers carrying a conflict marker. */
export const detectConflictMarkers = (contents: string): number[] => {
  const found: number[] = [];
  contents.split('\n').forEach((line, index) => {
    if (isConflictMarker(line)) found.push(index + 1);
  });
  return found;
};

/**
 * A NUL byte in the first 8 KiB is the conventional signal that a file is
 * binary, and it is what keeps this check safe to run over every tracked file.
 */
export const looksBinary = (contents: Buffer): boolean => contents.subarray(0, 8192).includes(0);

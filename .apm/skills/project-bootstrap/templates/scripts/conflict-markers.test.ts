import { describe, expect, it } from 'vitest';

import { detectConflictMarkers, looksBinary } from './conflict-markers';

describe('conflict marker detection', () => {
  it('reports every marker in a full conflict block', () => {
    const conflicted = [
      'diff --git a/x b/x',
      '<<<<<<< Updated upstream',
      'a',
      '=======',
      'b',
      '||||||| Stash base',
      '>>>>>>> Stashed changes',
    ].join('\n');

    expect(detectConflictMarkers(conflicted)).toEqual([2, 6, 7]);
  });

  it('reports an opener with no matching closer, which is how one reached main', () => {
    // The opener was glued to a document's ticket header, so the file parsed as
    // prose and every review tool read past it.
    const spliced = [
      '# SEO / AIO / GEO Infrastructure Audit',
      '',
      '<<<<<<< Updated upstream **Ticket:** #196 — Existing SEO / Indexing audit',
      'body',
    ].join('\n');

    expect(detectConflictMarkers(spliced)).toEqual([3]);
  });

  it('reports a marker in a file type this check previously did not read', () => {
    // A `.html` prototype held a committed marker while an extension allowlist
    // reported the repository clean. Scanning every tracked file is what stops
    // that recurring for the next unanticipated file type.
    const prototype = ['<<<<<<< Updated upstream', '<!doctype html>', '<p>hi</p>'].join('\n');

    expect(detectConflictMarkers(prototype)).toEqual([1]);
  });

  it('reports markers a Markdown formatter rewrote as blockquotes and table rows', () => {
    // docs/spec/map-first-public-platform.md as committed in 81dd30ee: oxfmt
    // parsed the stash markers as Markdown and reformatted each one, so no
    // line began with a literal marker any more.
    const reformatted = [
      '## Appendix A — Decision register',
      '',
      '| Ticket  | Decision |',
      '| ------- | -------- |',
      '|         |          |     |     |     |     | Stash base |',
      '| ======= |',
      '',
      '## Product shape & visitor journey',
      '',
      '> > > > > > > Stashed changes',
      '',
      '| [MapLibre homepage map integration](https://example.test/195) | closed |',
    ].join('\n');

    expect(detectConflictMarkers(reformatted)).toEqual([5, 6, 10]);
  });

  it('reports a table row carrying a stash label, however the cells were padded', () => {
    expect(detectConflictMarkers('| a | Updated upstream |')).toEqual([1]);
    expect(detectConflictMarkers('|Stashed changes|')).toEqual([1]);
  });

  it('reports markers glued into the middle of a reflowed paragraph', () => {
    // docs/research/seo-indexing-audit.md as committed in 81dd30ee. The run is
    // built rather than written out so this file does not trip the check.
    const base = '|'.repeat(7);
    const reflowed =
      `add a route that calls \`createDerivedSurfaceHandler\`. ${base} Stash base ======= ` +
      '**Ticket:** #196 — Existing SEO / Indexing infrastructure audit';

    expect(detectConflictMarkers(reflowed)).toEqual([1]);
    // An indented marker, as HTML formatting left one in a prototype.
    expect(detectConflictMarkers(`  </body>\n  ${base} Stash base =======`)).toEqual([2]);
    expect(detectConflictMarkers(`    ${'>'.repeat(7)} Stashed changes`)).toEqual([1]);
  });

  it('leaves ordinary blockquotes and tables alone', () => {
    const markdown = [
      '> A quotation.',
      '> > A reply to it.',
      '> > > > > > Six levels deep is odd, but it is still a quotation.',
      '',
      '| Phase | Scope | Decisions |',
      '| --- | --- | --- |',
      '| P0 | Wire handlers | #196 |',
      '|  |  | trailing cell only |',
      '| Stash | base |',
      '| ====== |',
      '| ======== heading underline |',
      '',
      'Run `git stash` and read the Stashed changes section of the manual.',
      'The shell expression a || b || c is not a marker.',
    ].join('\n');

    expect(detectConflictMarkers(markdown)).toEqual([]);
  });

  it('leaves a clean document alone', () => {
    const clean = [
      '# Title',
      '',
      'Setext heading',
      '=======',
      '',
      'const marker = ">>>>>>> not a marker";',
      'const rule = "-------";',
    ].join('\n');

    expect(detectConflictMarkers(clean)).toEqual([]);
  });
});

describe('binary detection', () => {
  it('recognises binary content by a NUL byte', () => {
    // A PNG signature: the NUL is what makes it binary, not the high bytes.
    expect(looksBinary(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))).toBe(
      true,
    );
    expect(looksBinary(Buffer.concat([Buffer.from('text'), Buffer.from([0])]))).toBe(true);
  });

  it('only inspects the leading window, so a late NUL in a large text file is not a signal', () => {
    const padded = Buffer.concat([Buffer.from('a'.repeat(16_000)), Buffer.from([0])]);
    expect(looksBinary(padded)).toBe(false);
  });

  it('treats text as text, including utf-8 above ASCII', () => {
    expect(looksBinary(Buffer.from('plain text', 'utf8'))).toBe(false);
    expect(looksBinary(Buffer.from('curly — quote · dash', 'utf8'))).toBe(false);
  });
});

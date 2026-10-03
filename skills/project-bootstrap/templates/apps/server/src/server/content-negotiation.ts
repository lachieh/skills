export type Representation = 'html' | 'markdown';

type AcceptEntry = { type: string; subtype: string; quality: number; specificity: number };

function parseAccept(accept: string): AcceptEntry[] {
  return accept.split(',').flatMap((clause) => {
    const [mediaRange = '', ...params] = clause.split(';').map((part) => part.trim());
    const [type = '', subtype = ''] = mediaRange.toLowerCase().split('/');
    if (!type || !subtype) return [];
    const qualityParam = params.find((param) => param.startsWith('q='));
    const quality = qualityParam ? Number(qualityParam.slice(2)) : 1;
    const specificity = type === '*' ? 0 : subtype === '*' ? 1 : 2;
    return Number.isFinite(quality) ? [{ type, subtype, quality, specificity }] : [];
  });
}

function qualityOf(entries: AcceptEntry[], type: string, subtype: string): number {
  return (
    entries
      .filter(
        (entry) =>
          (entry.type === type || entry.type === '*') &&
          (entry.subtype === subtype || entry.subtype === '*'),
      )
      .sort((left, right) => right.specificity - left.specificity)[0]?.quality ?? 0
  );
}

// Markdown is offered only to clients that ask for it by name and rank it at
// least as high as HTML; everyone else keeps the HTML page.
export function preferredRepresentation(accept: string | null | undefined): Representation {
  if (!accept) return 'html';
  const entries = parseAccept(accept);
  const asksForMarkdown = entries.some(
    (entry) => entry.type === 'text' && entry.subtype === 'markdown',
  );
  if (!asksForMarkdown) return 'html';
  return qualityOf(entries, 'text', 'markdown') >= qualityOf(entries, 'text', 'html')
    ? 'markdown'
    : 'html';
}

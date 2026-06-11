// Heading-anchor resolution for the doc viewer (DEC-30). GitHub-style slugs so
// a ref written as `backlog.md#ship-check-task-21--v01-cut-line` matches the
// anchor GitHub itself would make; short anchors (#b1) prefix-match their full
// heading. Pure + vitest-first (rule 17).

export function githubSlug(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
}

export type SectionMatch =
  | { kind: 'none' } // ref had no anchor — nothing to find
  | { kind: 'missing' } // anchor named, no heading matches — say so, don't fail silently
  | { kind: 'found'; range: [number, number] }; // [start, end) line range

export function locateSection(lines: readonly string[], anchor?: string): SectionMatch {
  if (!anchor) return { kind: 'none' };
  const headings: { line: number; slug: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const h = /^#{1,4}\s+(.*)$/.exec(lines[i] ?? '');
    if (h) headings.push({ line: i, slug: githubSlug(h[1] ?? '') });
  }
  const rangeAt = (idx: number): [number, number] => [
    headings[idx]!.line,
    headings[idx + 1]?.line ?? lines.length,
  ];
  // Exact match wins over prefix: "#movement" must hit "Movement", not the
  // earlier "Movement ranges".
  const exact = headings.findIndex((h) => h.slug === anchor);
  if (exact >= 0) return { kind: 'found', range: rangeAt(exact) };
  const prefix = headings.findIndex((h) => h.slug.startsWith(anchor + '-'));
  if (prefix >= 0) return { kind: 'found', range: rangeAt(prefix) };
  return { kind: 'missing' };
}

// T36 (TASK-28): anchor slugs must match what GitHub generates, short anchors
// prefix-match, and a miss is reported — never silently shown as "the top".
import { describe, expect, it } from 'vitest';
import { githubSlug, locateSection } from './anchors.ts';

describe('githubSlug (T36)', () => {
  it('keeps each space as a dash and drops punctuation, GitHub-style', () => {
    expect(githubSlug('Ship-check (TASK-21) — v0.1 cut line')).toBe(
      'ship-check-task-21--v01-cut-line',
    );
    expect(githubSlug('Movement ranges')).toBe('movement-ranges');
    expect(githubSlug('B1 — Harness skeleton')).toBe('b1--harness-skeleton');
  });
});

describe('locateSection (T36)', () => {
  const doc = [
    '# Doc',
    'intro',
    '## Movement ranges',
    'a',
    'b',
    '## Movement',
    'c',
    '### B1 — Harness skeleton',
    'd',
  ];

  it('exact match wins over an earlier prefix match', () => {
    expect(locateSection(doc, 'movement')).toEqual({ kind: 'found', range: [5, 7] });
  });
  it('short anchors prefix-match their full heading', () => {
    expect(locateSection(doc, 'b1')).toEqual({ kind: 'found', range: [7, 9] });
  });
  it('section runs to the next heading or end of file', () => {
    expect(locateSection(doc, 'movement-ranges')).toEqual({ kind: 'found', range: [2, 5] });
  });
  it('reports a miss instead of failing silently; no anchor = nothing to find', () => {
    expect(locateSection(doc, 'no-such-section')).toEqual({ kind: 'missing' });
    expect(locateSection(doc, undefined)).toEqual({ kind: 'none' });
  });
});

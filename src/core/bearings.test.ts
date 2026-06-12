// T39 (TASK-30): the bearings engine — ids beat keywords, doc sections carry
// openable refs, stopwords don't count as matches.
import { describe, expect, it } from 'vitest';
import type { CourtsideState } from '../contract/state.generated.ts';
import { docBearings, extractIds, gatherBearings, stateBearings, terms } from './bearings.ts';

const seedUrl = new URL('../../spec/fixtures/state.sample.json', import.meta.url);
const seed = async (): Promise<CourtsideState> =>
  JSON.parse((await import('node:fs')).readFileSync(seedUrl, 'utf-8')) as CourtsideState;

describe('extractIds / terms (T39)', () => {
  it('finds ids in any case; gate ids win over their task substring', () => {
    expect(extractIds('why is task-13 blocked, and what about g5-task-12?')).toEqual([
      'TASK-13',
      'G5-TASK-12',
    ]);
    expect(extractIds('tell me about D-3 and DEC-34')).toEqual(['D-3', 'DEC-34']);
  });
  it('drops stopwords and dedupes', () => {
    expect(terms('What is the crit formula?')).toEqual(['crit', 'formula']);
  });
});

describe('stateBearings (T39)', () => {
  it('an id named in the question outranks every keyword match', async () => {
    const b = stateBearings(await seed(), 'what is TASK-13 waiting on?');
    expect(b[0]!.source).toBe('board · TASK-13');
    expect(b[0]!.text).toContain('deps TASK-12');
  });
  it('keyword questions surface the open question with its recommendation', async () => {
    const b = stateBearings(await seed(), 'what is the crit formula when airborne?');
    expect(b[0]!.source).toBe('ledger · Q-7');
    expect(b[0]!.text).toContain('Rec:');
  });
});

describe('docBearings + gatherBearings (T39)', () => {
  const docs = [
    {
      name: 'gdd.md',
      text: '# GDD\nintro\n## Movement ranges\nUnits move SPD tiles.\n## Actions\nShoot or pass.\n',
    },
  ];
  it('doc sections score and carry an openable ref', () => {
    const b = docBearings(docs, 'how far can units move?');
    expect(b[0]!.ref).toBe('gdd.md#movement-ranges');
    expect(b[0]!.text).toContain('SPD');
  });
  it('gatherBearings merges board + docs, sorted, capped', async () => {
    const b = gatherBearings({ state: await seed(), docs, question: 'movement range', cap: 5 });
    expect(b.length).toBeLessThanOrEqual(5);
    expect(b.some((x) => x.ref === 'gdd.md#movement-ranges')).toBe(true);
    expect(b.some((x) => x.source.startsWith('board ·'))).toBe(true);
  });
});

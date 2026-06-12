// T29 (specs/tape-and-huddle.md B2): deterministic facts only, computed from
// state + decision log relative to a last-seen timestamp.
import { describe, expect, it } from 'vitest';
import type { CourtsideState } from '../contract/state.generated.ts';
import { buildHuddle } from './huddle.ts';

const seedUrl = new URL('../../spec/fixtures/state.sample.json', import.meta.url);
const seed = async (): Promise<CourtsideState> =>
  JSON.parse((await import('node:fs')).readFileSync(seedUrl, 'utf-8')) as CourtsideState;

const NOW = new Date('2026-06-10T23:00:00-05:00').getTime();

describe('buildHuddle (T29)', () => {
  it('reports waiting checkpoint, open question, agent state against an old last-seen', async () => {
    const h = buildHuddle(await seed(), [], '2026-06-05T00:00:00-05:00', NOW);
    const text = h.facts.map((f) => f.text).join('\n');
    expect(text).toContain('G5-TASK-12');
    expect(text).toContain('Q-7');
    expect(text).toContain('TASK-15'); // what Q-7 blocks
    expect(text).toContain('Waiting for your okay');
    expect(h.sinceLabel).toContain('d');
  });

  it('counts tasks done and decisions made since last seen', async () => {
    const state = await seed();
    const decisions = [
      { seq: 1, ts: '2026-06-10T20:00:00-05:00', gateId: 'G5-TASK-12', decision: 'approve' },
    ];
    const h = buildHuddle(state, decisions, '2026-06-09T00:00:00-05:00', NOW);
    const text = h.facts.map((f) => f.text).join('\n');
    expect(text).toContain('1 decision');
    // fixture decision DEC-11 (June 10) is after June 9 last-seen
    expect(text).toContain('TASK-11');
  });

  it('caught-up case yields the quiet fact', async () => {
    const state = await seed();
    state.gates = [];
    state.questions = [];
    state.agent.state = 'idle';
    const h = buildHuddle(state, [], new Date(NOW - 60_000).toISOString(), NOW);
    expect(h.facts.some((f) => f.text.includes('caught up'))).toBe(true);
  });

  it('a decided gate is no longer "waiting on you" (TASK-28)', async () => {
    const h = buildHuddle(await seed(), [], '2026-06-05T00:00:00-05:00', NOW, ['G5-TASK-12']);
    expect(h.facts.some((f) => f.kind === 'waiting')).toBe(false);
  });

  it('agent self-report is claimed; structural facts are verified (TASK-28)', async () => {
    const h = buildHuddle(await seed(), [], '2026-06-05T00:00:00-05:00', NOW);
    expect(h.facts.find((f) => f.kind === 'agent')?.provenance).toBe('claimed');
    expect(h.facts.find((f) => f.kind === 'waiting')?.provenance).toBe('verified');
    expect(h.facts.find((f) => f.kind === 'question')?.provenance).toBe('verified');
  });
});

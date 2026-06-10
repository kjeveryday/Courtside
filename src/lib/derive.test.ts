// T11–T14 from specs/mission-control.md §B5 — written before the implementation.
import { describe, expect, it } from 'vitest';
import { ageBucket, cumulativeByDay, depsDepth, freshness } from './derive';

const task = (id: string, deps?: string[]) => ({
  id,
  title: id,
  status: 'todo',
  sourceRef: 'x',
  deps,
});

describe('depsDepth (T11)', () => {
  const tasks = [task('TASK-1'), task('TASK-2', ['TASK-1']), task('TASK-3', ['TASK-2'])];
  it('computes chain depths', () => {
    const depth = depsDepth(tasks);
    expect(depth.get('TASK-1')).toBe(0);
    expect(depth.get('TASK-2')).toBe(1);
    expect(depth.get('TASK-3')).toBe(2);
  });
  it('unknown dep counts as depth 0; cycles cap instead of hanging', () => {
    expect(depsDepth([task('TASK-9', ['TASK-404'])]).get('TASK-9')).toBe(0);
    const cyc = depsDepth([task('TASK-1', ['TASK-2']), task('TASK-2', ['TASK-1'])]);
    expect(cyc.get('TASK-1')).toBeLessThanOrEqual(2);
  });
});

describe('cumulativeByDay (T12)', () => {
  it('accumulates per local day, ordered, multi-per-day collapses', () => {
    const pts = cumulativeByDay([
      '2026-06-08T10:00:00Z',
      '2026-06-08T11:00:00Z',
      '2026-06-10T09:00:00Z',
    ]);
    expect(pts.length).toBe(2);
    expect(pts[0]!.count).toBe(2);
    expect(pts[1]!.count).toBe(3);
    expect(cumulativeByDay([])).toEqual([]);
  });
});

describe('ageBucket (T13)', () => {
  const now = new Date('2026-06-10T12:00:00Z').getTime();
  it('risk at >= 3 days, muted below', () => {
    expect(ageBucket('2026-06-07T12:00:00Z', now)).toBe('risk');
    expect(ageBucket('2026-06-08T12:00:01Z', now)).toBe('muted');
  });
});

describe('freshness (T14)', () => {
  const now = new Date('2026-06-10T12:00:00Z').getTime();
  it('ok < 1h, muted < 24h, risk after', () => {
    expect(freshness('2026-06-10T11:30:00Z', now)).toBe('ok');
    expect(freshness('2026-06-10T01:00:00Z', now)).toBe('muted');
    expect(freshness('2026-06-08T12:00:00Z', now)).toBe('risk');
    expect(freshness(undefined, now)).toBe('risk');
  });
});

// T7–T10 from specs/scorebug.md §B6 — written before the implementation.
import { describe, expect, it } from 'vitest';
import type { CourtsideState } from '../contract/state.generated';
import { formatAgo, humanizeAgentState, kindColor, latestEventOfKind } from './format';

type Ev = CourtsideState['events'][number];
const ev = (ts: string, kind: Ev['kind']): Ev => ({
  ts,
  kind,
  provenance: 'claimed',
  text: 'x',
});

describe('formatAgo (T7)', () => {
  const now = new Date('2026-06-10T12:00:00Z').getTime();
  it('buckets at boundaries', () => {
    expect(formatAgo('2026-06-10T11:59:31Z', now)).toBe('just now');
    expect(formatAgo('2026-06-10T11:57:00Z', now)).toBe('3 min ago');
    expect(formatAgo('2026-06-10T10:00:00Z', now)).toBe('2 h ago');
    expect(formatAgo('2026-06-04T12:00:00Z', now)).toBe('6 d ago');
  });
});

describe('latestEventOfKind (T8)', () => {
  it('returns the newest by ts and undefined when absent', () => {
    const events = [
      ev('2026-06-10T10:00:00Z', 'test_run'),
      ev('2026-06-10T11:00:00Z', 'test_run'),
      ev('2026-06-10T12:00:00Z', 'narration'),
    ];
    expect(latestEventOfKind(events, 'test_run')?.ts).toBe('2026-06-10T11:00:00Z');
    expect(latestEventOfKind(events, 'gate')).toBeUndefined();
    expect(latestEventOfKind([], 'narration')).toBeUndefined();
  });
});

describe('humanizeAgentState (T9)', () => {
  it('maps all four enum values', () => {
    expect(humanizeAgentState('working')).toBe('Working on your game');
    expect(humanizeAgentState('parked_at_gate')).toBe('Waiting for your okay');
    expect(humanizeAgentState('blocked')).toBe('Needs a conversation');
    expect(humanizeAgentState('idle')).toBe('Ready');
  });
});

describe('kindColor (T10)', () => {
  it('maps every schema event kind to a token class', () => {
    const kinds: Ev['kind'][] = [
      'narration',
      'test_run',
      'lint',
      'audit',
      'gate',
      'capture',
      'push',
    ];
    for (const k of kinds) {
      expect(kindColor(k)).toMatch(/^bg-/);
    }
  });
});

// T16 (specs/live-wire.md B2): plan-dir resolution precedence.
import { describe, expect, it } from 'vitest';
import { resolvePlanDir } from './config.ts';

const FIX = 'spec/fixtures/sample-project/plan';

describe('resolvePlanDir (T16)', () => {
  it('--plan-dir beats env beats ./plan beats fixture', () => {
    const exists = () => true;
    expect(resolvePlanDir(['--plan-dir', '/x'], { COURTSIDE_PLAN_DIR: '/e' }, '/cwd', exists)).toBe(
      '/x',
    );
    expect(resolvePlanDir([], { COURTSIDE_PLAN_DIR: '/e' }, '/cwd', exists)).toBe('/e');
    expect(resolvePlanDir([], {}, '/cwd', exists)).toBe('/cwd/plan');
  });
  it('falls back to the harness fixture only when ./plan has no state.json', () => {
    const exists = (p: string) => p.includes(FIX);
    expect(resolvePlanDir([], {}, '/cwd', exists)).toBe(`/cwd/${FIX}`);
  });
  it('throws a friendly error when nothing resolves', () => {
    expect(() => resolvePlanDir([], {}, '/cwd', () => false)).toThrow(/plan directory/i);
  });
});

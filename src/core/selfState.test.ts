// T35: this repo's own plan/state.json (the dogfood view, dev:self) must stay
// valid and lint-clean — drift here means the review surface lies.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lintPlan } from './lint.ts';

const planDir = new URL('../../plan', import.meta.url).pathname;

describe('self plan/state.json (T35)', () => {
  it.skipIf(!existsSync(`${planDir}/state.json`))('validates and lints with zero failures', () => {
    const findings = lintPlan(planDir, '/tmp/courtside-selftest-runtime');
    expect(findings.filter((f) => f.level === 'fail')).toEqual([]);
  });
});

// T23 (specs/the-gate.md B1) — lint: clean fixture passes; seeded breakages caught.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { lintPlan } from './lint.ts';

const seedDir = new URL('../../spec/fixtures/sample-project/plan/', import.meta.url).pathname;
const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;

function freshPlan(): { tmp: string; planDir: string; runtimeDir: string } {
  const tmp = mkdtempSync(join(tmpdir(), 'courtside-lint-'));
  const planDir = join(tmp, 'plan');
  cpSync(seedDir, planDir, { recursive: true });
  cpSync(seedState, join(planDir, 'state.json'));
  return { tmp, planDir, runtimeDir: join(tmp, '.courtside') };
}

const trash: string[] = [];
afterAll(() => trash.forEach((t) => rmSync(t, { recursive: true, force: true })));

describe('lintPlan (T23)', () => {
  it('passes the shipped fixture (warnings allowed, no failures)', () => {
    const { tmp, planDir, runtimeDir } = freshPlan();
    trash.push(tmp);
    const findings = lintPlan(planDir, runtimeDir);
    expect(findings.filter((f) => f.level === 'fail')).toEqual([]);
  });
  it('catches broken refs and missing files', () => {
    const { tmp, planDir, runtimeDir } = freshPlan();
    trash.push(tmp);
    const state = JSON.parse(readFileSync(join(planDir, 'state.json'), 'utf-8')) as {
      tasks: { deps?: string[] }[];
      gates: { payloadRef?: string }[];
    };
    state.tasks[2]!.deps = ['TASK-999'];
    state.gates[0]!.payloadRef = 'gates/NOPE.json';
    writeFileSync(join(planDir, 'state.json'), JSON.stringify(state, null, 2));
    const findings = lintPlan(planDir, runtimeDir);
    // dangling dep = warn (may have aged out of a windowed list); missing payload = fail
    expect(findings.some((f) => f.level === 'warn' && f.text.includes('TASK-999'))).toBe(true);
    expect(findings.some((f) => f.level === 'fail' && f.text.includes('NOPE.json'))).toBe(true);
  });
  it('fails on schema-invalid state', () => {
    const { tmp, planDir, runtimeDir } = freshPlan();
    trash.push(tmp);
    writeFileSync(join(planDir, 'state.json'), '{"schema":"courtside/v0"}');
    const fails = lintPlan(planDir, runtimeDir).filter((f) => f.level === 'fail');
    expect(fails.length).toBeGreaterThan(0);
  });
});

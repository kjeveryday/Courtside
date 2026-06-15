// T25 (specs/the-gate.md B4): the simulated next agent session consumes inbox
// decisions exactly the way CLAUDE.md tells the real agent to.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { CourtsideState } from '../contract/state.generated.ts';
import { appendDecision } from './decisions.ts';
import { resetFixture, simulateAgentSession } from './agentSession.ts';

const seedDir = new URL('../../spec/fixtures/sample-project/plan/', import.meta.url).pathname;
const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;

function fresh(decision: 'approve' | 'reject', comment: string) {
  const tmp = mkdtempSync(join(tmpdir(), 'courtside-sim-'));
  const planDir = join(tmp, 'plan');
  cpSync(seedDir, planDir, { recursive: true });
  cpSync(seedState, join(planDir, 'state.json'));
  appendDecision({
    planDir,
    runtimeDir: join(tmp, '.courtside'),
    gateId: 'G5-TASK-12',
    taskId: 'TASK-12',
    decision,
    comment,
    steps: [{ text: 'step', checked: true }],
  });
  return { tmp, planDir };
}

const readBack = (planDir: string) =>
  JSON.parse(readFileSync(join(planDir, 'state.json'), 'utf-8')) as CourtsideState;

const trash: string[] = [];
afterAll(() => trash.forEach((t) => rmSync(t, { recursive: true, force: true })));

describe('simulateAgentSession (T25)', () => {
  it('approve: gate approved, task done, agent moves on, inbox consumed', () => {
    const { tmp, planDir } = fresh('approve', '');
    trash.push(tmp);
    const summary = simulateAgentSession(planDir);
    expect(summary.consumed).toBe(1);
    const state = readBack(planDir);
    expect(state.gates.find((g) => g.id === 'G5-TASK-12')?.status).toBe('approved');
    expect(state.tasks.find((t) => t.id === 'TASK-12')?.status).toBe('done');
    expect(state.agent.state).toBe('working');
    expect(state.tasks.find((t) => t.id === state.agent.currentTask)?.status).toBe('in-progress');
    expect(state.events.some((e) => e.kind === 'gate' && e.text.includes('approve'))).toBe(true);
    expect(existsSync(join(planDir, 'decisions-inbox', 'consumed', 'G5-TASK-12.json'))).toBe(true);
  });

  it('reject: task → revise, rejections+1, agent reworks', () => {
    const { tmp, planDir } = fresh('reject', 'corner tile is wrong');
    trash.push(tmp);
    simulateAgentSession(planDir);
    const state = readBack(planDir);
    const task = state.tasks.find((t) => t.id === 'TASK-12');
    expect(state.gates.find((g) => g.id === 'G5-TASK-12')?.status).toBe('rejected');
    expect(task?.status).toBe('revise');
    expect(task?.rejections).toBe(1);
    expect(state.agent.narration ?? '').toContain('corner tile is wrong');
  });

  it('no inbox → no-op', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'courtside-sim-'));
    trash.push(tmp);
    const planDir = join(tmp, 'plan');
    cpSync(seedDir, planDir, { recursive: true });
    cpSync(seedState, join(planDir, 'state.json'));
    expect(simulateAgentSession(planDir).consumed).toBe(0);
  });

  it('T30: resetFixture restores the seed story and clears demo decisions', () => {
    const { tmp, planDir } = fresh('approve', '');
    trash.push(tmp);
    simulateAgentSession(planDir); // state advanced, inbox consumed
    resetFixture(planDir, join(tmp, '.courtside'), seedState);
    const state = readBack(planDir);
    expect(state.agent.state).toBe('parked_at_gate');
    expect(state.gates.find((g) => g.id === 'G5-TASK-12')?.status).toBe('pending');
    expect(existsSync(join(planDir, 'decisions-inbox', 'consumed'))).toBe(false);
    expect(existsSync(join(tmp, '.courtside', 'decision-log.ndjson'))).toBe(false);
  });
});

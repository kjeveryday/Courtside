// T31–T33 (DEC-29): directive validation, signed inbox + chain integrity with
// mixed entry types, simulator consumption, and the real-spawn path via a stub
// agent command (no Claude usage in tests).
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { CourtsideState } from '../contract/state.generated.ts';
import { simulateAgentSession } from '../core/agentSession.ts';
import { appendDecision, appendDirective, readDecisionLog } from '../core/decisions.ts';
import { loadOrCreateSecret, verifyChain } from '../core/signing.ts';
import { dispatchAgent } from './agentRunner.ts';
import { buildDirective } from './dispatch.ts';

const seedDir = new URL('../../spec/fixtures/sample-project/plan/', import.meta.url).pathname;
const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
const seed = (): CourtsideState => JSON.parse(readFileSync(seedState, 'utf-8')) as CourtsideState;

const trash: string[] = [];
afterAll(() => trash.forEach((t) => rmSync(t, { recursive: true, force: true })));

function freshPlan() {
  const tmp = mkdtempSync(join(tmpdir(), 'courtside-disp-'));
  trash.push(tmp);
  const planDir = join(tmp, 'plan');
  cpSync(seedDir, planDir, { recursive: true });
  cpSync(seedState, join(planDir, 'state.json'));
  return { tmp, planDir, runtimeDir: join(tmp, '.courtside') };
}

describe('buildDirective (T31)', () => {
  it('validates tasks: dispatchable statuses only', () => {
    expect(buildDirective(seed(), { kind: 'task', id: 'TASK-13' })).toHaveProperty('directive');
    expect(buildDirective(seed(), { kind: 'task', id: 'TASK-11' })).toMatchObject({ status: 409 });
    expect(buildDirective(seed(), { kind: 'task', id: 'TASK-999' })).toMatchObject({ status: 404 });
  });
  it('validates questions: must be open with an answer', () => {
    expect(
      buildDirective(seed(), { kind: 'question', id: 'Q-7', answer: 'Same formula, +10% flat' }),
    ).toHaveProperty('directive');
    expect(buildDirective(seed(), { kind: 'question', id: 'Q-7' })).toMatchObject({ status: 400 });
    expect(buildDirective(seed(), { kind: 'question', id: 'Q-9', answer: 'x' })).toMatchObject({
      status: 404,
    });
  });
});

describe('directives in the signed chain + simulator (T32)', () => {
  it('mixed decisions + directives chain-verify; simulator consumes both kinds', () => {
    const { tmp, planDir, runtimeDir } = freshPlan();
    appendDecision({
      planDir,
      runtimeDir,
      gateId: 'G5-TASK-12',
      decision: 'approve',
      comment: '',
      steps: [],
    });
    appendDirective({
      planDir,
      runtimeDir,
      kind: 'task',
      id: 'TASK-13',
      instruction: 'Work TASK-13.',
      context: 'platform edges first',
    });
    appendDirective({
      planDir,
      runtimeDir,
      kind: 'question',
      id: 'Q-7',
      instruction: 'Q-7 answered.',
      answer: 'Same formula, +10% flat',
    });
    expect(verifyChain(loadOrCreateSecret(runtimeDir), readDecisionLog(runtimeDir))).toEqual({
      ok: true,
    });

    const summary = simulateAgentSession(planDir);
    expect(summary.consumed).toBe(3);
    const state = JSON.parse(readFileSync(join(planDir, 'state.json'), 'utf-8')) as CourtsideState;
    expect(state.tasks.find((t) => t.id === 'TASK-13')?.status).toBe('in-progress');
    const q = (state.questions ?? []).find((x) => x.id === 'Q-7');
    expect(q?.status).toBe('answered');
    expect(q?.answerRef).toContain('consumed');
    expect(existsSync(join(planDir, 'decisions-inbox', 'directive-TASK-13.json'))).toBe(false);
    void tmp;
  });
});

describe('dispatchAgent with a stub command (T33)', () => {
  it('spawns, captures the prompt to the log, reports exit', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'courtside-run-'));
    trash.push(tmp);
    const run = await new Promise<import('./agentRunner.ts').AgentRun>((resolve) => {
      const r = dispatchAgent({
        agentCmd: 'node -e console.log(process.argv[2]) --',
        cwd: tmp,
        runtimeDir: tmp,
        kind: 'task',
        id: 'TASK-13',
        instruction: 'Work TASK-13 — Move unit along selected path.',
        context: 'careful with edges',
        onExit: resolve,
      });
      void r;
    });
    expect(run.status).toBe('exited');
    const log = readFileSync(run.logFile, 'utf-8');
    expect(log).toContain('TASK-13');
    expect(log).toContain('careful with edges');
    expect(log).toContain('decisions-inbox');
  });
});

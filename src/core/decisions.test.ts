// T22 (specs/the-gate.md B1) — one decision = three artifacts, all consistent.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { appendDecision, readDecisionLog } from './decisions.ts';
import { loadOrCreateSecret, verifyChain } from './signing.ts';

const tmp = mkdtempSync(join(tmpdir(), 'courtside-dec-'));
const planDir = join(tmp, 'plan');
const runtimeDir = join(tmp, '.courtside');
mkdirSync(planDir, { recursive: true });

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('appendDecision (T22)', () => {
  it('writes chained log + signed inbox file + decisions.md line', () => {
    const first = appendDecision({
      planDir,
      runtimeDir,
      gateId: 'G5-TASK-12',
      taskId: 'TASK-12',
      decision: 'approve',
      comment: '',
      steps: [{ text: 'step 1', checked: true }],
    });
    const second = appendDecision({
      planDir,
      runtimeDir,
      gateId: 'G3-BACKLOG',
      decision: 'reject',
      comment: 'split TASK-9',
      steps: [],
    });
    expect(first.seq).toBe(1);
    expect(second.seq).toBe(2);

    const log = readDecisionLog(runtimeDir);
    const secret = loadOrCreateSecret(runtimeDir);
    expect(verifyChain(secret, log)).toEqual({ ok: true });

    const inbox = JSON.parse(
      readFileSync(join(planDir, 'decisions-inbox', 'G5-TASK-12.json'), 'utf-8'),
    ) as { schema: string; decision: string; by: string; mac: string };
    expect(inbox.schema).toBe('courtside/decision-v0');
    expect(inbox.decision).toBe('approve');
    expect(inbox.by).toBe('human');
    expect(inbox.mac).toBe(log[0]!.mac);

    const md = readFileSync(join(planDir, 'decisions.md'), 'utf-8');
    expect(md).toContain('G5-TASK-12');
    expect(md).toContain('split TASK-9');
    expect(existsSync(join(runtimeDir, 'secret'))).toBe(true);
  });
});

// T24 (specs/the-gate.md B2): server-enforced decision rules + artifacts on disk.
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { startServer } from './main.ts';

const seedDir = new URL('../../spec/fixtures/sample-project/plan/', import.meta.url).pathname;
const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'courtside-gates-'));
const planDir = join(tmp, 'plan');
cpSync(seedDir, planDir, { recursive: true });
cpSync(seedState, join(planDir, 'state.json'));

const server = await startServer({
  planDir,
  port: 0,
  runtimeDir: join(tmp, '.courtside'),
  watch: false,
});
const base = `http://127.0.0.1:${server.port}`;
const auth = { authorization: `Bearer ${server.token}`, 'content-type': 'application/json' };

afterAll(async () => {
  await server.close();
  rmSync(tmp, { recursive: true, force: true });
});

const fourSteps = (checked: boolean) =>
  Array.from({ length: 4 }, (_, i) => ({ text: `step ${i + 1}`, checked }));

describe('decisions API (T24)', () => {
  it('state payload carries the joined gate (payload + no decision yet)', async () => {
    const res = await fetch(`${base}/api/state`, { headers: auth });
    const body = (await res.json()) as {
      gates: { gate: { id: string }; payload?: { tldr: string }; decided?: unknown }[];
    };
    expect(body.gates.length).toBe(1);
    expect(body.gates[0]!.gate.id).toBe('G5-TASK-12');
    expect(body.gates[0]!.payload?.tldr).toContain('highlights every tile');
    expect(body.gates[0]!.decided).toBeUndefined();
  });

  it('reject without a comment → 400 (F19)', async () => {
    const res = await fetch(`${base}/api/decisions`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ gateId: 'G5-TASK-12', decision: 'reject', comment: '', steps: [] }),
    });
    expect(res.status).toBe(400);
  });

  it('approve with unchecked steps → 400 (F7)', async () => {
    const res = await fetch(`${base}/api/decisions`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        gateId: 'G5-TASK-12',
        decision: 'approve',
        comment: '',
        steps: fourSteps(false),
      }),
    });
    expect(res.status).toBe(400);
  });

  it('unknown gate → 404; then a valid approve → 200 + artifacts; repeat → 409', async () => {
    const missing = await fetch(`${base}/api/decisions`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ gateId: 'G5-NOPE', decision: 'approve', comment: '', steps: [] }),
    });
    expect(missing.status).toBe(404);

    const ok = await fetch(`${base}/api/decisions`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        gateId: 'G5-TASK-12',
        decision: 'approve',
        comment: 'looks right',
        steps: [...fourSteps(true).slice(0, 3), { text: 'step 4', skippedReason: 'no gamepad' }],
      }),
    });
    expect(ok.status).toBe(200);
    expect(existsSync(join(planDir, 'decisions-inbox', 'G5-TASK-12.json'))).toBe(true);
    expect(existsSync(join(planDir, 'decisions.md'))).toBe(true);

    const again = await fetch(`${base}/api/decisions`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        gateId: 'G5-TASK-12',
        decision: 'approve',
        comment: '',
        steps: fourSteps(true),
      }),
    });
    expect(again.status).toBe(409);

    const state = await fetch(`${base}/api/state`, { headers: auth });
    const body = (await state.json()) as { gates: { decided?: { decision: string } }[] };
    expect(body.gates[0]!.decided?.decision).toBe('approve');
  });
});

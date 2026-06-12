// T40 (TASK-30): /api/ask — bearings always (board + guide), prose answer only
// when an agent command is connected (stubbed here), guide openable everywhere.
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { startServer } from './main.ts';

const seedDir = new URL('../../spec/fixtures/sample-project/plan/', import.meta.url).pathname;
const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'courtside-ask-'));
const planDir = join(tmp, 'plan');
cpSync(seedDir, planDir, { recursive: true });
cpSync(seedState, join(planDir, 'state.json'));
const stub = join(tmp, 'stub.mjs');
writeFileSync(stub, "console.log('STUB ANSWER');\n");

const server = await startServer({
  planDir,
  port: 0,
  runtimeDir: join(tmp, '.courtside'),
  watch: false,
});
const withAgent = await startServer({
  planDir,
  port: 0,
  runtimeDir: join(tmp, '.courtside2'),
  watch: false,
  agentCmd: `node ${stub}`,
});

afterAll(async () => {
  await server.close();
  await withAgent.close();
  rmSync(tmp, { recursive: true, force: true });
});

const ask = async (s: { port: number; token: string }, question: string) => {
  const res = await fetch(`http://127.0.0.1:${s.port}/api/ask`, {
    method: 'POST',
    headers: { authorization: `Bearer ${s.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

describe('/api/ask (T40)', () => {
  it('needs a question', async () => {
    expect((await ask(server, '')).status).toBe(400);
  });

  it('answers "what is waiting on me" from the live board, no agent needed', async () => {
    const { status, body } = await ask(server, 'what is waiting on me right now?');
    expect(status).toBe(200);
    expect(body.agentConfigured).toBe(false);
    expect(body.answer).toBeUndefined();
    const texts = (body.bearings as { text: string }[]).map((b) => b.text).join('\n');
    expect(texts).toContain('G5-TASK-12');
    expect(texts).toContain('waiting on the human');
  });

  it('tool questions hit the Courtside guide with an openable ref', async () => {
    const { body } = await ask(server, 'how do I decide a gate, and is approving safe?');
    const refs = (body.bearings as { ref?: string }[]).map((b) => b.ref);
    expect(refs).toContain('courtside-guide.md#deciding-a-gate');
  });

  it('with an agent command connected, a prose answer comes back', async () => {
    const { body } = await ask(withAgent, 'summarize the board');
    expect(body.agentConfigured).toBe(true);
    expect(body.answer).toBe('STUB ANSWER');
  });

  it('the guide itself serves via /api/doc in any project', async () => {
    const res = await fetch(`http://127.0.0.1:${server.port}/api/doc/courtside-guide.md`, {
      headers: { authorization: `Bearer ${server.token}` },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('# Courtside guide');
  });
});

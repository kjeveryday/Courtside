// T17 (specs/live-wire.md B2): boot on an ephemeral port against a temp plan dir;
// /api/state is 401 without the token and 200 + validated state with it.
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { startServer } from './main.ts';

const seed = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'courtside-test-'));
const planDir = join(tmp, 'plan');
cpSync(seed, join(planDir, 'state.json'));

const server = await startServer({ planDir, port: 0, runtimeDir: join(tmp, '.courtside') });

afterAll(async () => {
  await server.close();
  rmSync(tmp, { recursive: true, force: true });
});

describe('server core (T17)', () => {
  const base = `http://127.0.0.1:${server.port}`;

  it('rejects /api/state without the token', async () => {
    const res = await fetch(`${base}/api/state`);
    expect(res.status).toBe(401);
  });

  it('rejects a wrong token', async () => {
    const res = await fetch(`${base}/api/state`, {
      headers: { authorization: `Bearer ${'0'.repeat(32)}` },
    });
    expect(res.status).toBe(401);
  });

  it('serves validated state with the token; first visit is a cold return', async () => {
    const res = await fetch(`${base}/api/state`, {
      headers: { authorization: `Bearer ${server.token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      result: { ok: boolean; state?: { schema: string } };
      coldReturn?: boolean;
    };
    expect(body.result.ok).toBe(true);
    expect(body.result.state?.schema).toBe('courtside/v0');
    expect(body.coldReturn).toBe(true);
  });

  it('a fetch inside the same sitting is not a cold return (TASK-29)', async () => {
    const res = await fetch(`${base}/api/state`, {
      headers: { authorization: `Bearer ${server.token}` },
    });
    const body = (await res.json()) as { coldReturn?: boolean };
    expect(body.coldReturn).toBe(false);
  });

  it('unknown api routes 404 (with auth)', async () => {
    const res = await fetch(`${base}/api/nope`, {
      headers: { authorization: `Bearer ${server.token}` },
    });
    expect(res.status).toBe(404);
  });
});

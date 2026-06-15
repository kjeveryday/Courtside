// T18–T20 (specs/live-wire.md B3) — written before the implementation.
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { openDb } from './db.ts';
import { startServer } from './main.ts';
import { debounce } from './watch.ts';

describe('debounce (T18)', () => {
  it('collapses bursts into one trailing call', async () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    const fn = debounce(() => calls.push(Date.now()), 100);
    fn();
    fn();
    fn();
    vi.advanceTimersByTime(99);
    expect(calls.length).toBe(0);
    vi.advanceTimersByTime(2);
    expect(calls.length).toBe(1);
    vi.useRealTimers();
  });
});

describe('sqlite event log (T19)', () => {
  it('inserts and reads back events; kv roundtrips', () => {
    const dir = mkdtempSync(join(tmpdir(), 'courtside-db-'));
    const db = openDb(join(dir, 'test.db'));
    db.insertEvent({ kind: 'state_change', provenance: 'verified', text: 'state revalidated' });
    db.insertEvent({ kind: 'validation_failed', provenance: 'verified', text: 'boom' });
    const rows = db.recentEvents(10);
    expect(rows.length).toBe(2);
    expect(rows[0]!.text).toBe('boom'); // newest first
    db.setKv('last_seen', '2026-06-10T00:00:00Z');
    expect(db.getKv('last_seen')).toBe('2026-06-10T00:00:00Z');
    expect(db.getKv('missing')).toBeUndefined();
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('ws live push (T20)', () => {
  const seed = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
  const tmp = mkdtempSync(join(tmpdir(), 'courtside-live-'));
  const planDir = join(tmp, 'plan');
  cpSync(seed, join(planDir, 'state.json'));

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('authenticated client receives a state broadcast after a file change', async () => {
    const server = await startServer({
      planDir,
      port: 0,
      runtimeDir: join(tmp, '.courtside'),
      watch: true,
      watchDebounceMs: 30,
    });
    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws?token=${server.token}`);
    await new Promise((resolve, reject) => {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
    const message = new Promise<string>((resolve) => ws.once('message', (d) => resolve(String(d))));
    // touch the watched file with a narration change
    const next = JSON.parse(
      (await import('node:fs')).readFileSync(join(planDir, 'state.json'), 'utf-8'),
    ) as { agent: { narration: string } };
    next.agent.narration = 'Live update test.';
    writeFileSync(join(planDir, 'state.json'), JSON.stringify(next, null, 2));

    const payload = JSON.parse(await message) as {
      kind: string;
      result: { ok: boolean; state?: { agent: { narration: string } } };
    };
    expect(payload.kind).toBe('state');
    expect(payload.result.ok).toBe(true);
    expect(payload.result.state?.agent.narration).toBe('Live update test.');
    ws.close();
    await server.close();
  }, 10_000);

  it('unauthenticated ws upgrade is refused', async () => {
    const server = await startServer({ planDir, port: 0, runtimeDir: join(tmp, '.c2') });
    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
    const outcome = await new Promise<string>((resolve) => {
      ws.once('open', () => resolve('open'));
      ws.once('error', () => resolve('refused'));
    });
    expect(outcome).toBe('refused');
    await server.close();
  });
});

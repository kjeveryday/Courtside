// T45 (TASK-33, D-3): a failed agent launch is remembered across server
// restarts — the red chip must not silently revert to "in agent inbox".
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { openDb } from './db.ts';
import { allRuns, persistRun, persistedRuns, type AgentRun } from './agentRunner.ts';
import { startServer } from './main.ts';

const tmp = mkdtempSync(join(tmpdir(), 'courtside-runs-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const failed: AgentRun = {
  id: 'TASK-13',
  kind: 'task',
  startedAt: new Date().toISOString(),
  status: 'failed',
  exitCode: 1,
  logFile: '/tmp/x.log',
};

describe('run persistence (T45)', () => {
  it('finished runs round-trip through the db; running ones are never stored', () => {
    const db = openDb(join(tmp, 'a.db'));
    persistRun(db, { ...failed, status: 'running' });
    expect(persistedRuns(db)).toEqual([]);
    persistRun(db, failed);
    expect(persistedRuns(db)[0]?.status).toBe('failed');
    expect(allRuns(db).some((r) => r.id === 'TASK-13' && r.status === 'failed')).toBe(true);
    db.close();
  });

  it('a failed launch survives a server restart (D-3)', async () => {
    const seedState = new URL('../../spec/fixtures/state.sample.json', import.meta.url).pathname;
    const planDir = join(tmp, 'plan');
    const runtimeDir = join(tmp, '.courtside');
    writeFileSync(join(tmp, 'fail.mjs'), 'process.exit(1);\n');
    const { cpSync, mkdirSync } = await import('node:fs');
    mkdirSync(planDir, { recursive: true });
    cpSync(seedState, join(planDir, 'state.json'));

    const s1 = await startServer({
      planDir,
      port: 0,
      runtimeDir,
      watch: false,
      agentCmd: `node ${join(tmp, 'fail.mjs')}`,
    });
    const auth = { authorization: `Bearer ${s1.token}`, 'content-type': 'application/json' };
    const r = await fetch(`http://127.0.0.1:${s1.port}/api/dispatch`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ kind: 'task', id: 'TASK-13' }),
    });
    expect(r.status).toBe(200);
    await new Promise((res) => setTimeout(res, 500)); // let the stub exit
    await s1.close();

    const s2 = await startServer({ planDir, port: 0, runtimeDir, watch: false });
    const state = (await (
      await fetch(`http://127.0.0.1:${s2.port}/api/state`, {
        headers: { authorization: `Bearer ${s2.token}` },
      })
    ).json()) as { agentRuns: AgentRun[] };
    const remembered = state.agentRuns.find((x) => x.id === 'TASK-13');
    expect(remembered?.status).toBe('failed');
    expect(remembered?.exitCode).toBe(1);
    await s2.close();
  });
});

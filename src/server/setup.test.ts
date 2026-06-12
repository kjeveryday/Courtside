// T42/T43 (TASK-31): the setup wizard end-to-end — an empty project boots into
// setup mode, one POST stands the whole board up, nothing existing is touched,
// and the written config immediately powers agent features.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { startServer } from './main.ts';
import { resolveProjectDir, runSetup } from './setup.ts';

const tmp = mkdtempSync(join(tmpdir(), 'courtside-setup-'));
// keep the launcher-pointer write inside the sandbox, not the dev's real home
process.env.COURTSIDE_HOME = tmp;
const planDir = join(tmp, 'plan'); // does NOT exist yet — that's the point
const stub = join(tmp, 'stub.mjs');
writeFileSync(stub, "console.log('COURTSIDE OK');\n");

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

describe('setup mode + /api/setup (T43)', () => {
  it('an empty project serves setup mode, not a refusal', async () => {
    const body = (await (await fetch(`${base}/api/state`, { headers: auth })).json()) as {
      setup?: boolean;
      setupInfo?: { projectName: string; mdFiles: string[] };
    };
    expect(body.setup).toBe(true);
    expect(body.setupInfo?.mdFiles).toEqual([]);
  });

  it('text-mode setup writes the full starter set and the board goes live', async () => {
    const res = await fetch(`${base}/api/setup`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        projectName: 'Hoops',
        gddMode: 'text',
        gddText: 'A tactics game about a basketball heist.',
        engine: 'godot',
        agentCmd: `node ${stub}`,
      }),
    });
    expect(res.status).toBe(200);
    const out = (await res.json()) as { written: string[] };
    expect(out.written).toEqual(
      expect.arrayContaining(['gdd.md', 'CLAUDE.md', 'courtside.config.json', 'plan/state.json']),
    );
    const gdd = readFileSync(join(tmp, 'gdd.md'), 'utf-8');
    expect(gdd).toContain('basketball heist');
    expect(gdd).toContain('## Pillars'); // plain description → starter sections
    expect(readFileSync(join(tmp, 'CLAUDE.md'), 'utf-8')).toContain('plan/decisions-inbox/');

    const state = (await (await fetch(`${base}/api/state`, { headers: auth })).json()) as {
      setup?: boolean;
      agentConfigured?: boolean;
      result: { ok: boolean; state?: { tasks: unknown[]; phase: string } };
    };
    expect(state.setup).toBe(false);
    expect(state.result.ok).toBe(true);
    expect(state.result.state?.phase).toBe('0');
    // the config the wizard just wrote powers agent features with no restart
    expect(state.agentConfigured).toBe(true);
    // the desktop launcher's pointer now names this project (T46 route seam)
    expect(readFileSync(join(tmp, '.courtside', 'last-project'), 'utf-8').trim()).toBe(tmp);
  });

  it('running setup twice on the same folder is refused', async () => {
    const res = await fetch(`${base}/api/setup`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ gddMode: 'text', gddText: 'again' }),
    });
    expect(res.status).toBe(409);
  });

  it('test-agent round-trips the configured command', async () => {
    const res = await fetch(`${base}/api/setup/test-agent`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ agentCmd: `node ${stub}` }),
    });
    const body = (await res.json()) as { ok: boolean; detail: string };
    expect(body.ok).toBe(true);
    expect(body.detail).toContain('COURTSIDE OK');
  });

  it('/api/setup/info preflights a candidate folder; bad paths are named', async () => {
    const other = mkdtempSync(join(tmpdir(), 'courtside-where-'));
    writeFileSync(join(other, 'notes.md'), '# notes\n');
    const ok = await fetch(`${base}/api/setup/info?dir=${encodeURIComponent(other)}`, {
      headers: auth,
    });
    expect(ok.status).toBe(200);
    const { info } = (await ok.json()) as { info: { root: string; mdFiles: string[] } };
    expect(info.root).toBe(other);
    expect(info.mdFiles).toContain('notes.md');
    const bad = await fetch(`${base}/api/setup/info?dir=relative/path`, { headers: auth });
    expect(bad.status).toBe(400);
    rmSync(other, { recursive: true, force: true });
  });

  it('picking a different folder sets up THERE and the server follows (TASK-32)', async () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'courtside-dest-')), 'my-game');
    const res = await fetch(`${base}/api/setup`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        dir: dest,
        projectName: 'Elsewhere',
        gddMode: 'text',
        gddText: 'A game set up in a chosen folder.',
      }),
    });
    expect(res.status).toBe(200);
    expect(existsSync(join(dest, 'plan', 'state.json'))).toBe(true);
    // the same server now serves the new project
    const state = (await (await fetch(`${base}/api/state`, { headers: auth })).json()) as {
      setup?: boolean;
      result: { ok: boolean; state?: { events: { text: string }[] } };
    };
    expect(state.setup).toBe(false);
    expect(state.result.ok).toBe(true);
    expect(state.result.state?.events[0]?.text).toContain('"Elsewhere"');
  });
});

describe('runSetup honesty (T42)', () => {
  it('never overwrites: an existing CLAUDE.md and gdd are kept, not replaced', () => {
    const proj = mkdtempSync(join(tmpdir(), 'courtside-setup2-'));
    writeFileSync(join(proj, 'CLAUDE.md'), 'MINE\n');
    writeFileSync(join(proj, 'design.md'), '# My GDD\n');
    const out = runSetup({
      planDir: join(proj, 'plan'),
      courtsideRoot: process.cwd(),
      answers: { projectName: 'Mine', gddMode: 'have', gddPath: 'design.md' },
    });
    expect(out.status).toBe(200);
    const p = out.payload as { written: string[]; kept: string[] };
    expect(p.kept).toEqual(expect.arrayContaining(['design.md', 'CLAUDE.md']));
    expect(readFileSync(join(proj, 'CLAUDE.md'), 'utf-8')).toBe('MINE\n');
    expect(existsSync(join(proj, 'plan', 'state.json'))).toBe(true);
    rmSync(proj, { recursive: true, force: true });
  });

  it('rejects a gdd path that is not on the discovered list', () => {
    const proj = mkdtempSync(join(tmpdir(), 'courtside-setup3-'));
    const out = runSetup({
      planDir: join(proj, 'plan'),
      courtsideRoot: process.cwd(),
      answers: { gddMode: 'have', gddPath: '../../etc/passwd.md' },
    });
    expect(out.status).toBe(400);
    rmSync(proj, { recursive: true, force: true });
  });

  it('pasted text with headings lands verbatim — no starter scaffolding bolted on', () => {
    const proj = mkdtempSync(join(tmpdir(), 'courtside-setup4-'));
    const doc = '# My Full GDD\n\nEverything already written.\n## Combat\nDetails.';
    const out = runSetup({
      planDir: join(proj, 'plan'),
      courtsideRoot: process.cwd(),
      answers: { gddMode: 'text', gddText: doc },
    });
    expect(out.status).toBe(200);
    expect(readFileSync(join(proj, 'gdd.md'), 'utf-8')).toBe(doc + '\n');
    rmSync(proj, { recursive: true, force: true });
  });
});

describe('resolveProjectDir (T44)', () => {
  const fallback = '/fallback/project';
  it('empty input means the folder the server already watches', () => {
    expect(resolveProjectDir('', fallback)).toEqual({ ok: true, root: fallback });
    expect(resolveProjectDir(undefined, fallback)).toEqual({ ok: true, root: fallback });
  });
  it('expands ~ against the home folder', () => {
    const r = resolveProjectDir('~/somewhere-new', tmpdir());
    expect(r.ok && r.root.startsWith(homedir())).toBe(true);
  });
  it('refuses relative paths, missing parents, files, and the demo fixture', () => {
    expect(resolveProjectDir('relative/path', fallback).ok).toBe(false);
    expect(resolveProjectDir('/no/such/parent/anywhere/x', fallback).ok).toBe(false);
    const tmp = mkdtempSync(join(tmpdir(), 'courtside-rpd-'));
    writeFileSync(join(tmp, 'afile'), 'x');
    expect(resolveProjectDir(join(tmp, 'afile'), fallback).ok).toBe(false);
    expect(resolveProjectDir(join(tmp, 'spec', 'fixtures', 'sample-project'), fallback).ok).toBe(
      false,
    );
    rmSync(tmp, { recursive: true, force: true });
  });
});

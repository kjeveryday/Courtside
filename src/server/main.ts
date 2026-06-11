// Server entry: binds 127.0.0.1 only (R7), prints the token URL once, serves the
// built app + gated API, watches the plan dir and pushes validated state over WS,
// logging server-observed events to SQLite (verified provenance by construction).
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { resetFixture, simulateAgentSession } from '../core/agentSession.ts';
import { generateToken } from './auth.ts';
import { openDb, type Db } from './db.ts';
import { createHandler, json, statePayload, type HttpContext } from './http.ts';
import { readState } from './state.ts';
import { watchPlanDir } from './watch.ts';
import { attachWs } from './ws.ts';

export type StartOptions = {
  planDir: string;
  port?: number;
  distDir?: string;
  runtimeDir?: string;
  announce?: boolean;
  watch?: boolean;
  watchDebounceMs?: number;
  agentCmd?: string; // DEC-29: enables real agent launch on dispatch
};

export type RunningServer = {
  port: number;
  token: string;
  db: Db;
  close: () => Promise<void>;
};

const HOST = '127.0.0.1'; // security default, CLAUDE.md rule 15 — never configurable up

export async function startServer(opts: StartOptions): Promise<RunningServer> {
  const distDir = opts.distDir ?? new URL('../../dist', import.meta.url).pathname;
  const runtimeDir = opts.runtimeDir ?? new URL('../../.courtside', import.meta.url).pathname;
  mkdirSync(runtimeDir, { recursive: true });
  const db = openDb(join(runtimeDir, 'courtside.db'));

  const token = generateToken();
  const harness = opts.planDir.includes(join('spec', 'fixtures', 'sample-project'));
  const repoRoot = new URL('../..', import.meta.url).pathname;
  const ctx: HttpContext = {
    distDir,
    planDir: opts.planDir,
    runtimeDir,
    repoRoot,
    token,
    harness,
    agentCmd: opts.agentCmd ?? process.env.COURTSIDE_AGENT_CMD,
    db,
  };
  if (harness) {
    // Demo-only route (spec B4): lets the human drive the full async cycle from
    // the browser. Mounted exclusively when serving the fixture project.
    ctx.extraRoutes = (path, req, res) => {
      if (req.method === 'POST' && path === '/api/dev/agent-session') {
        const summary = simulateAgentSession(opts.planDir);
        db.insertEvent({
          kind: 'agent_session_sim',
          provenance: 'verified',
          text: summary.actions.join('; '),
        });
        json(res, 200, summary);
        return true;
      }
      if (req.method === 'POST' && path === '/api/dev/reset') {
        const seed = join(repoRoot, 'spec', 'fixtures', 'state.sample.json');
        json(res, 200, resetFixture(opts.planDir, runtimeDir, seed));
        return true;
      }
      return false;
    };
  }
  const server = createServer(createHandler(ctx));
  const ws = attachWs(server, token);

  const watcher =
    (opts.watch ?? true)
      ? watchPlanDir(
          opts.planDir,
          () => {
            const result = readState(opts.planDir);
            db.insertEvent({
              kind: result.ok ? 'state_change' : 'validation_failed',
              provenance: 'verified',
              text: result.ok
                ? `state revalidated ok (${result.state.tasks.length} tasks)`
                : `state invalid: ${result.errors[0] ?? 'unknown'}`,
            });
            ws.broadcast({ kind: 'state', ...statePayload(ctx) });
          },
          opts.watchDebounceMs ?? 150,
        )
      : undefined;

  const port = await new Promise<number>((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port ?? 4310, HOST, () => {
      const addr = server.address();
      resolve(typeof addr === 'object' && addr ? addr.port : (opts.port ?? 4310));
    });
  });

  if (opts.announce) {
    console.log(`\nCourtside serving ${opts.planDir}`);
    console.log(`Open: http://${HOST}:${port}/?token=${token}\n`);
  }

  return {
    port,
    token,
    db,
    close: () =>
      new Promise<void>((resolve, reject) => {
        watcher?.close();
        ws.close();
        db.close();
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

// Server entry: binds 127.0.0.1 only (R7), prints the token URL once, serves the
// built app + gated API, watches the plan dir and pushes validated state over WS,
// logging server-observed events to SQLite (verified provenance by construction).
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { resetFixture, simulateAgentSession } from '../core/agentSession.ts';
import { generateToken } from './auth.ts';
import { openDb, type Db } from './db.ts';
import { json, statePayload, type HttpContext } from './http.ts';
import { createHandler } from './routes.ts';
import { projectRepoUrl } from './repo.ts';
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
  // Runtime state (decision chain, secret, db) lives NEXT TO the plan it serves:
  // the demo fixture and the real project must never share an audit trail — a
  // demo "reset" must not be able to touch real signed decisions.
  const runtimeDir = opts.runtimeDir ?? join(dirname(opts.planDir), '.courtside');
  mkdirSync(runtimeDir, { recursive: true });
  // a missing plan dir is a FRESH project, not an error — the wizard takes it
  // from here (TASK-31); the watcher needs the dir to exist to see setup land
  mkdirSync(opts.planDir, { recursive: true });
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
    agentCmdOverride: opts.agentCmd,
    repoUrl: projectRepoUrl(dirname(opts.planDir)),
    db,
  };
  if (harness) {
    // Demo-only routes (spec B4), mounted exclusively when BOOTED on the
    // fixture; inert if setup ever re-points this server elsewhere.
    ctx.extraRoutes = (path, req, res) => {
      if (!ctx.harness) return false;
      if (req.method === 'POST' && path === '/api/dev/agent-session') {
        const summary = simulateAgentSession(ctx.planDir);
        ctx.db.insertEvent({
          kind: 'agent_session_sim',
          provenance: 'verified',
          text: summary.actions.join('; '),
        });
        json(res, 200, summary);
        return true;
      }
      if (req.method === 'POST' && path === '/api/dev/reset') {
        const seed = join(repoRoot, 'spec', 'fixtures', 'state.sample.json');
        ctx.db.clearEvents(); // demo-scoped db — the reset story starts clean too
        json(res, 200, resetFixture(ctx.planDir, ctx.runtimeDir, seed));
        return true;
      }
      return false;
    };
  }
  const server = createServer(createHandler(ctx));
  const ws = attachWs(server, token);
  ctx.broadcast = () => ws.broadcast({ kind: 'state', ...statePayload(ctx) });

  const onPlanChange = () => {
    const result = readState(ctx.planDir);
    ctx.db.insertEvent({
      kind: result.ok ? 'state_change' : 'validation_failed',
      provenance: 'verified',
      text: result.ok
        ? `state revalidated ok (${result.state.tasks.length} tasks)`
        : `state invalid: ${result.errors[0] ?? 'unknown'}`,
    });
    ctx.broadcast?.();
  };
  let watcher =
    (opts.watch ?? true)
      ? watchPlanDir(opts.planDir, onPlanChange, opts.watchDebounceMs ?? 150)
      : undefined;

  // Setup may stand the project up in a DIFFERENT folder (TASK-32): swap the
  // watched plan, runtime, db, and remote in place — same server, same token.
  ctx.repoint = (newPlanDir: string) => {
    const newRuntime = join(dirname(newPlanDir), '.courtside');
    mkdirSync(newRuntime, { recursive: true });
    mkdirSync(newPlanDir, { recursive: true });
    const oldDb = ctx.db;
    ctx.db = openDb(join(newRuntime, 'courtside.db'));
    oldDb.close();
    ctx.planDir = newPlanDir;
    ctx.runtimeDir = newRuntime;
    ctx.harness = newPlanDir.includes(join('spec', 'fixtures', 'sample-project'));
    ctx.repoUrl = projectRepoUrl(dirname(newPlanDir));
    watcher?.close();
    if (opts.watch ?? true)
      watcher = watchPlanDir(newPlanDir, onPlanChange, opts.watchDebounceMs ?? 150);
    ctx.broadcast?.();
  };

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
    get db() {
      return ctx.db; // repoint swaps the db; callers always see the live one
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        watcher?.close();
        ws.close();
        ctx.db.close();
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

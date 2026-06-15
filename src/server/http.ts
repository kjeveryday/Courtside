// Server context + the helpers every route shares (auth, json, the state
// payload, agent-command resolution). The routes themselves live in routes.ts
// (split per rule 12 — D-4); the static shell lives in static.ts.
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { pendingDispatches } from '../core/decisions.ts';
import { readProjectConfig, resolveAgentCmd } from '../core/projectConfig.ts';
import { allRuns } from './agentRunner.ts';
import { extractToken, tokenEquals } from './auth.ts';
import type { Db } from './db.ts';
import { gateViews } from './gates.ts';
import { setupInfo } from './setup.ts';
import { readState } from './state.ts';

export type HttpContext = {
  distDir: string;
  planDir: string;
  runtimeDir: string;
  repoRoot: string;
  token: string;
  harness: boolean;
  // explicit agent-command override (tests/flags); the live value comes from
  // agentCmdOf — override > env > courtside.config.json (DEC-37)
  agentCmdOverride?: string;
  db: Db;
  // browsable remote of the WATCHED project (not necessarily this repo) —
  // commit hashes link there; absent = hashes stay plain text
  repoUrl?: string;
  // push the current state to connected clients (wired by main once WS exists) —
  // agent exits must show up without waiting for an unrelated file change
  broadcast?: () => void;
  // swap the watched project in place (wired by main) — setup uses this when
  // the owner picks a different folder (TASK-32)
  repoint?: (newPlanDir: string) => void;
  // extension point: TASK-16 mounts the harness-only agent-session route here
  extraRoutes?: (path: string, req: IncomingMessage, res: ServerResponse) => boolean;
};

export function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function agentCmdOf(ctx: Pick<HttpContext, 'planDir' | 'agentCmdOverride'>) {
  return resolveAgentCmd(
    ctx.agentCmdOverride,
    process.env.COURTSIDE_AGENT_CMD,
    readProjectConfig(dirname(ctx.planDir)),
  );
}

export function authorized(ctx: HttpContext, req: IncomingMessage): boolean {
  return tokenEquals(ctx.token, extractToken(req.headers.authorization, req.url ?? ''));
}

export function statePayload(ctx: HttpContext) {
  const result = readState(ctx.planDir);
  // no state.json at all = a fresh project → the wizard, not the refusal screen
  const setup = !existsSync(join(ctx.planDir, 'state.json'));
  return {
    receivedAt: new Date().toISOString(),
    harness: ctx.harness,
    agentConfigured: Boolean(agentCmdOf(ctx)),
    repoUrl: ctx.repoUrl,
    setup,
    setupInfo: setup ? setupInfo(ctx.planDir) : undefined,
    result,
    gates: gateViews(ctx.planDir, result.ok ? result.state : undefined),
    dispatches: pendingDispatches(ctx.planDir),
    agentRuns: allRuns(ctx.db),
    // the server's own observed events (dispatches, agent runs, refusals) —
    // the one stream Courtside truly verified, so the ticker must show it.
    // Routine revalidation noise stays out of Kyle's feed.
    serverEvents: ctx.db.recentEvents(12).filter((e) => e.kind !== 'state_change'),
  };
}

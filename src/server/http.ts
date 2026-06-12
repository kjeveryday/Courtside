// Request routing: gated /api/* + open static app shell from dist/ (AD-6 note:
// the shell carries no data; every byte of state sits behind the token).
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { safeTapePath } from './tape.ts';
import {
  appendDirective,
  decisionFor,
  pendingDispatches,
  readDecisionLog,
} from '../core/decisions.ts';
import { runDoctor } from '../core/doctor.ts';
import { buildHuddle } from '../core/huddle.ts';
import { allRuns, dispatchAgent } from './agentRunner.ts';
import { safeArtifactPath } from './artifacts.ts';
import { extractToken, tokenEquals } from './auth.ts';
import type { Db } from './db.ts';
import { buildDirective } from './dispatch.ts';
import { safeDocPath } from './docs.ts';
import { decideGate, gateViews, type DecisionRequest } from './gates.ts';
import { readState } from './state.ts';

// Last-seen tracking for the Huddle (DEC-26): prev_seen rotates only after a
// 30-minute gap, so reloads inside a sitting don't wipe the diff window. A
// rotation means a cold return — the UI greets it by opening the Huddle.
function touchLastSeen(ctx: HttpContext): boolean {
  const now = new Date().toISOString();
  const last = ctx.db.getKv('last_seen');
  const cold = !last || Date.now() - new Date(last).getTime() > 30 * 60_000;
  if (cold) ctx.db.setKv('prev_seen', last ?? now);
  ctx.db.setKv('last_seen', now);
  return cold;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

export type HttpContext = {
  distDir: string;
  planDir: string;
  runtimeDir: string;
  repoRoot: string;
  token: string;
  harness: boolean;
  agentCmd?: string;
  db: Db;
  // browsable remote of the WATCHED project (not necessarily this repo) —
  // commit hashes link there; absent = hashes stay plain text
  repoUrl?: string;
  // push the current state to connected clients (wired by main once WS exists) —
  // agent exits must show up without waiting for an unrelated file change
  broadcast?: () => void;
  // extension point: TASK-16 mounts the harness-only agent-session route here
  extraRoutes?: (path: string, req: IncomingMessage, res: ServerResponse) => boolean;
};

export function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function authorized(ctx: HttpContext, req: IncomingMessage): boolean {
  return tokenEquals(ctx.token, extractToken(req.headers.authorization, req.url ?? ''));
}

export function statePayload(ctx: HttpContext) {
  const result = readState(ctx.planDir);
  return {
    receivedAt: new Date().toISOString(),
    harness: ctx.harness,
    agentConfigured: Boolean(ctx.agentCmd),
    repoUrl: ctx.repoUrl,
    result,
    gates: gateViews(ctx.planDir, result.ok ? result.state : undefined),
    dispatches: pendingDispatches(ctx.planDir),
    agentRuns: allRuns(),
    // the server's own observed events (dispatches, agent runs, refusals) —
    // the one stream Courtside truly verified, so the ticker must show it.
    // Routine revalidation noise stays out of Kyle's feed.
    serverEvents: ctx.db.recentEvents(12).filter((e) => e.kind !== 'state_change'),
  };
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 1_000_000) throw new Error('body too large');
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
}

export async function handleApi(ctx: HttpContext, req: IncomingMessage, res: ServerResponse) {
  if (!authorized(ctx, req)) return json(res, 401, { error: 'missing or invalid token' });
  const path = (req.url ?? '').split('?')[0] ?? '';
  if (req.method === 'GET' && path === '/api/state') {
    const coldReturn = touchLastSeen(ctx);
    return json(res, 200, { ...statePayload(ctx), coldReturn });
  }
  if (req.method === 'GET' && path === '/api/huddle') {
    const result = readState(ctx.planDir);
    if (!result.ok) return json(res, 200, { sinceLabel: '', facts: [], invalid: true });
    const lastSeen =
      ctx.db.getKv('prev_seen') ?? ctx.db.getKv('last_seen') ?? new Date(0).toISOString();
    const log = readDecisionLog(ctx.runtimeDir);
    const decidedIds = result.state.gates
      .filter((g) => decisionFor(ctx.planDir, g.id))
      .map((g) => g.id);
    return json(res, 200, buildHuddle(result.state, log, lastSeen, Date.now(), decidedIds));
  }
  if (req.method === 'GET' && path === '/api/doctor') {
    // Server-run checks = verified provenance (F18); the UI renders, never invents.
    return json(res, 200, {
      ranAt: new Date().toISOString(),
      findings: runDoctor({
        repoRoot: ctx.repoRoot,
        planDir: ctx.planDir,
        runtimeDir: ctx.runtimeDir,
      }),
    });
  }
  if (req.method === 'POST' && path === '/api/decisions') {
    let body: DecisionRequest;
    try {
      body = (await readBody(req)) as DecisionRequest;
    } catch (err) {
      return json(res, 400, { error: `bad request body: ${(err as Error).message}` });
    }
    const result = readState(ctx.planDir);
    const ruling = decideGate(
      ctx.planDir,
      ctx.runtimeDir,
      result.ok ? result.state : undefined,
      body,
    );
    if (ruling.status === 200) return json(res, 200, { ok: true, seq: ruling.seq });
    return json(res, ruling.status, { error: ruling.error });
  }
  if (req.method === 'POST' && path === '/api/dispatch') {
    let body: { kind?: string; id?: string; answer?: string; context?: string };
    try {
      body = (await readBody(req)) as typeof body;
    } catch (err) {
      return json(res, 400, { error: `bad request body: ${(err as Error).message}` });
    }
    const result = readState(ctx.planDir);
    if (!result.ok) return json(res, 409, { error: 'state invalid — fix it before dispatching' });
    const ruling = buildDirective(result.state, body);
    if ('error' in ruling) return json(res, ruling.status, { error: ruling.error });
    appendDirective({ planDir: ctx.planDir, runtimeDir: ctx.runtimeDir, ...ruling.directive });
    ctx.db.insertEvent({
      kind: 'dispatch',
      provenance: 'verified',
      text: `${ruling.directive.kind} ${ruling.directive.id} sent to agent${ctx.agentCmd ? ' (launching)' : ' (queued for next session)'}`,
    });
    if (ctx.agentCmd) {
      dispatchAgent({
        agentCmd: ctx.agentCmd,
        cwd: ctx.repoRoot,
        runtimeDir: ctx.runtimeDir,
        kind: ruling.directive.kind,
        id: ruling.directive.id,
        instruction: ruling.directive.instruction,
        context: ruling.directive.context,
        onExit: (run) => {
          ctx.db.insertEvent({
            kind: 'agent_run',
            provenance: 'verified',
            text: `agent ${run.status} on ${run.kind} ${run.id} (exit ${run.exitCode ?? '—'})`,
          });
          ctx.broadcast?.(); // a dead agent must not keep wearing the running chip
        },
      });
    }
    return json(res, 200, { ok: true, launched: Boolean(ctx.agentCmd) });
  }
  if (req.method === 'GET' && path.startsWith('/api/tape/')) {
    const file = safeTapePath(ctx.planDir, path);
    if (!file || !existsSync(file)) return json(res, 404, { error: 'no such tape frame' });
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  if (req.method === 'GET' && path.startsWith('/api/doc/')) {
    const file = safeDocPath(ctx.planDir, path);
    if (!file || !existsSync(file)) return json(res, 404, { error: 'no such doc' });
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end(readFileSync(file));
  }
  if (req.method === 'GET' && path.startsWith('/api/artifact/')) {
    const file = safeArtifactPath(ctx.planDir, path);
    if (!file || !existsSync(file)) return json(res, 404, { error: 'no such artifact' });
    res.writeHead(200, {
      'content-type': MIME[extname(file)] ?? 'text/plain; charset=utf-8',
    });
    return res.end(readFileSync(file));
  }
  if (ctx.extraRoutes?.(path, req, res)) return;
  return json(res, 404, { error: `no such route: ${req.method} ${path}` });
}

export function handleStatic(ctx: HttpContext, req: IncomingMessage, res: ServerResponse) {
  const rawPath = (req.url ?? '/').split('?')[0] ?? '/';
  const safe = normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(ctx.distDir, safe === '/' ? 'index.html' : safe);
  if (!filePath.startsWith(ctx.distDir)) return json(res, 403, { error: 'forbidden' });
  try {
    const body = readFileSync(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    // SPA fallback: unknown paths get the shell (it locks itself without a token).
    try {
      const body = readFileSync(join(ctx.distDir, 'index.html'));
      res.writeHead(200, { 'content-type': MIME['.html'] as string });
      res.end(body);
    } catch {
      json(res, 404, { error: 'app shell missing — run the build (npm run dev rebuilds it)' });
    }
  }
}

export function createHandler(ctx: HttpContext) {
  return (req: IncomingMessage, res: ServerResponse) => {
    if ((req.url ?? '').startsWith('/api/')) {
      handleApi(ctx, req, res).catch((err: unknown) =>
        json(res, 500, { error: (err as Error).message }),
      );
      return;
    }
    return handleStatic(ctx, req, res);
  };
}

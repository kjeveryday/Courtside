// The gated /api/* surface (split from http.ts per rule 12 — D-4). Every
// route reads ctx live, so a setup re-point swaps the whole tool's target.
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { appendDirective, decisionFor, readDecisionLog } from '../core/decisions.ts';
import { runDoctor } from '../core/doctor.ts';
import { buildHuddle } from '../core/huddle.ts';
import { dispatchAgent, persistRun } from './agentRunner.ts';
import { safeArtifactPath } from './artifacts.ts';
import { askAgent, handleAsk } from './ask.ts';
import { buildDirective } from './dispatch.ts';
import { safeDocPath } from './docs.ts';
import { decideGate, type DecisionRequest } from './gates.ts';
import { agentCmdOf, authorized, json, statePayload, type HttpContext } from './http.ts';
import { writeLastProject } from './lastProject.ts';
import { resolveProjectDir, runSetup, setupInfo } from './setup.ts';
import { readState } from './state.ts';
import { handleStatic, MIME } from './static.ts';
import { safeTapePath } from './tape.ts';

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
        agentCmd: agentCmdOf(ctx),
      }),
    });
  }
  if (req.method === 'POST' && path === '/api/ask') {
    let body: { question?: unknown; transcript?: unknown };
    try {
      body = (await readBody(req)) as typeof body;
    } catch (err) {
      return json(res, 400, { error: `bad request body: ${(err as Error).message}` });
    }
    const result = readState(ctx.planDir);
    const out = await handleAsk(
      { ...ctx, agentCmd: agentCmdOf(ctx) },
      body,
      result.ok ? result.state : undefined,
    );
    if (out.status === 200)
      ctx.db.insertEvent({
        kind: 'ask',
        provenance: 'verified',
        text: `asked: ${String(body.question).slice(0, 80)}`,
      });
    return json(res, out.status, out.payload);
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
    const agentCmd = agentCmdOf(ctx);
    appendDirective({ planDir: ctx.planDir, runtimeDir: ctx.runtimeDir, ...ruling.directive });
    ctx.db.insertEvent({
      kind: 'dispatch',
      provenance: 'verified',
      text: `${ruling.directive.kind} ${ruling.directive.id} sent to agent${agentCmd ? ' (launching)' : ' (queued for next session)'}`,
    });
    if (agentCmd) {
      dispatchAgent({
        agentCmd,
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
          persistRun(ctx.db, run); // D-3: outcome survives a server restart
          ctx.broadcast?.(); // a dead agent must not keep wearing the running chip
        },
      });
    }
    return json(res, 200, { ok: true, launched: Boolean(agentCmd) });
  }
  if (req.method === 'GET' && path === '/api/setup/info') {
    // candidate-folder preflight: validate the path, return what's found there
    const dir = new URL(req.url ?? '', 'http://x').searchParams.get('dir') ?? '';
    const ruling = resolveProjectDir(dir, dirname(ctx.planDir));
    if (!ruling.ok) return json(res, 400, { error: ruling.error });
    return json(res, 200, { info: setupInfo(join(ruling.root, 'plan')) });
  }
  if (req.method === 'POST' && path === '/api/setup') {
    let body: Record<string, unknown>;
    try {
      body = (await readBody(req)) as Record<string, unknown>;
    } catch (err) {
      return json(res, 400, { error: `bad request body: ${(err as Error).message}` });
    }
    const ruling = resolveProjectDir(body.dir, dirname(ctx.planDir));
    if (!ruling.ok) return json(res, 400, { error: ruling.error });
    const targetPlan = join(ruling.root, 'plan');
    const out = runSetup({ planDir: targetPlan, courtsideRoot: ctx.repoRoot, answers: body });
    if (out.status === 200) {
      // a different folder = the server follows the project (watcher, runtime,
      // db all swap); the receipt event lands in the NEW project's runtime
      if (targetPlan !== ctx.planDir) ctx.repoint?.(targetPlan);
      try {
        // the desktop launcher opens THIS project from now on
        writeLastProject(ruling.root);
      } catch {
        // a failed pointer write must never fail the setup itself
      }
      const p = out.payload as { written: string[] };
      ctx.db.insertEvent({
        kind: 'setup',
        provenance: 'verified',
        text: `project set up — wrote ${p.written.join(', ')}`,
      });
    }
    return json(res, out.status, out.payload);
  }
  if (req.method === 'POST' && path === '/api/setup/test-agent') {
    let body: { agentCmd?: unknown };
    try {
      body = (await readBody(req)) as typeof body;
    } catch (err) {
      return json(res, 400, { error: `bad request body: ${(err as Error).message}` });
    }
    const cmd =
      typeof body.agentCmd === 'string' && body.agentCmd.trim()
        ? body.agentCmd.trim()
        : agentCmdOf(ctx);
    if (!cmd) return json(res, 400, { error: 'no agent command to test' });
    const r = await askAgent({
      agentCmd: cmd,
      cwd: dirname(ctx.planDir),
      prompt: 'Reply with exactly: COURTSIDE OK',
      timeoutMs: 60_000,
    });
    return json(
      res,
      200,
      r.ok ? { ok: true, detail: r.answer.slice(0, 120) } : { ok: false, detail: r.error },
    );
  }
  if (req.method === 'GET' && path.startsWith('/api/tape/')) {
    const file = safeTapePath(ctx.planDir, path);
    if (!file || !existsSync(file)) return json(res, 404, { error: 'no such tape frame' });
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    return res.end(readFileSync(file));
  }
  if (req.method === 'GET' && path.startsWith('/api/doc/')) {
    let file = safeDocPath(ctx.planDir, path);
    // the tool's own manual opens in EVERY project — fixed literal, confined
    if ((!file || !existsSync(file)) && path === '/api/doc/courtside-guide.md')
      file = join(ctx.repoRoot, 'docs', 'courtside-guide.md');
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

export function createHandler(ctx: HttpContext) {
  return (req: IncomingMessage, res: ServerResponse) => {
    // Bookmark-friendly redirect: navigating to / without a token auto-adds it.
    // The server is 127.0.0.1-only, so exposing the token in a redirect is fine.
    const url = new URL(req.url ?? '/', 'http://x');
    if (req.method === 'GET' && url.pathname === '/' && !url.searchParams.get('token')) {
      res.writeHead(302, { location: `/?token=${encodeURIComponent(ctx.token)}` });
      return res.end();
    }
    if ((req.url ?? '').startsWith('/api/')) {
      handleApi(ctx, req, res).catch((err: unknown) =>
        json(res, 500, { error: (err as Error).message }),
      );
      return;
    }
    return handleStatic(ctx, req, res);
  };
}

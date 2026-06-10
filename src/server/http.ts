// Request routing: gated /api/* + open static app shell from dist/ (AD-6 note:
// the shell carries no data; every byte of state sits behind the token).
import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { safeTapePath } from './tape.ts';
import { runDoctor } from '../core/doctor.ts';
import { extractToken, tokenEquals } from './auth.ts';
import { decideGate, gateViews, type DecisionRequest } from './gates.ts';
import { readState } from './state.ts';

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
    result,
    gates: gateViews(ctx.planDir, result.ok ? result.state : undefined),
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
  if (req.method === 'GET' && path === '/api/state') return json(res, 200, statePayload(ctx));
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
  if (req.method === 'GET' && path.startsWith('/api/tape/')) {
    const file = safeTapePath(ctx.planDir, path);
    if (!file || !existsSync(file)) return json(res, 404, { error: 'no such tape frame' });
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
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

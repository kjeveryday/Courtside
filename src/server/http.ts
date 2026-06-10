// Request routing: gated /api/* + open static app shell from dist/ (AD-6 note:
// the shell carries no data; every byte of state sits behind the token).
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { extractToken, tokenEquals } from './auth.ts';
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

export type HttpContext = { distDir: string; planDir: string; token: string };

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function authorized(ctx: HttpContext, req: IncomingMessage): boolean {
  return tokenEquals(ctx.token, extractToken(req.headers.authorization, req.url ?? ''));
}

export function handleApi(ctx: HttpContext, req: IncomingMessage, res: ServerResponse) {
  if (!authorized(ctx, req)) return json(res, 401, { error: 'missing or invalid token' });
  const path = (req.url ?? '').split('?')[0];
  if (req.method === 'GET' && path === '/api/state') {
    return json(res, 200, { receivedAt: new Date().toISOString(), result: readState(ctx.planDir) });
  }
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
    if ((req.url ?? '').startsWith('/api/')) return handleApi(ctx, req, res);
    return handleStatic(ctx, req, res);
  };
}

// Static serving of the built app shell from dist/ (AD-6: the shell carries no
// data; every byte of state sits behind the token). Split from http.ts (rule 12).
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { json } from './http.ts';

export const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

export function handleStatic(ctx: { distDir: string }, req: IncomingMessage, res: ServerResponse) {
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

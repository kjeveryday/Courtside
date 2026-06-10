// Server entry: binds 127.0.0.1 only (R7), prints the token URL once, serves the
// built app + gated API. Programmatic startServer() is reused by tests (T17),
// the dev harness script, and later the CLI.
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { generateToken } from './auth.ts';
import { createHandler } from './http.ts';

export type StartOptions = {
  planDir: string;
  port?: number;
  distDir?: string;
  runtimeDir?: string;
  announce?: boolean;
};

export type RunningServer = {
  port: number;
  token: string;
  close: () => Promise<void>;
};

const HOST = '127.0.0.1'; // security default, CLAUDE.md rule 15 — never configurable up

export async function startServer(opts: StartOptions): Promise<RunningServer> {
  const distDir = opts.distDir ?? new URL('../../dist', import.meta.url).pathname;
  const runtimeDir = opts.runtimeDir ?? new URL('../../.courtside', import.meta.url).pathname;
  mkdirSync(runtimeDir, { recursive: true });

  const token = generateToken();
  const server = createServer(createHandler({ distDir, planDir: opts.planDir, token }));

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
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      ),
  };
}

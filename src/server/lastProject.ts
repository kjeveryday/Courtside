// The desktop launcher's durable pointer: the one project the Courtside icon
// opens. Written on every successful setup; read by the launcher script (zsh),
// never by the server. Lives in ~/.courtside — outside any repo, no secrets,
// one absolute path. COURTSIDE_HOME overrides the base for tests.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function defaultBase(): string {
  return process.env.COURTSIDE_HOME ?? homedir();
}

export function lastProjectFile(base: string = defaultBase()): string {
  return join(base, '.courtside', 'last-project');
}

export function writeLastProject(projectRoot: string, base: string = defaultBase()): string {
  mkdirSync(join(base, '.courtside'), { recursive: true });
  const file = lastProjectFile(base);
  writeFileSync(file, `${projectRoot}\n`);
  return file;
}

export function readLastProject(base: string = defaultBase()): string | undefined {
  const file = lastProjectFile(base);
  if (!existsSync(file)) return undefined;
  return readFileSync(file, 'utf8').trim() || undefined;
}

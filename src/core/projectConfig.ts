// courtside.config.json (TASK-31, DEC-37): the durable per-project settings the
// setup wizard writes — visible at the project root, user-editable, never
// secret material. The env var stays as a one-off override.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type ProjectConfig = {
  schema?: string;
  project?: string;
  engine?: 'godot' | 'unity' | 'none';
  gdd?: string; // project-root-relative path to the design doc
  gddDir?: string; // absolute path to an external folder of design docs
  agentCmd?: string;
};

const FILE = 'courtside.config.json';

export function readProjectConfig(projectRoot: string): ProjectConfig | undefined {
  const path = join(projectRoot, FILE);
  if (!existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as ProjectConfig;
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined; // unreadable config = no config; doctor will say so
  }
}

export function writeProjectConfig(projectRoot: string, cfg: ProjectConfig): string {
  const path = join(projectRoot, FILE);
  writeFileSync(path, JSON.stringify({ schema: 'courtside/config-v0', ...cfg }, null, 2) + '\n');
  return FILE;
}

// Precedence: explicit override (tests, flags) > env (one terminal) > config (durable).
export function resolveAgentCmd(
  override: string | undefined,
  env: string | undefined,
  cfg: ProjectConfig | undefined,
): string | undefined {
  return override ?? env ?? cfg?.agentCmd ?? undefined;
}

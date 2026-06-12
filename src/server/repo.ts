// Commit links (TASK-29): if the watched project has a git remote, the UI can
// link commit hashes straight to it. No remote (the demo fixture) = no links —
// a hash that can't resolve must stay plain text.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function originUrlFromConfig(configText: string): string | undefined {
  const m = /\[remote "origin"\][^[]*?url\s*=\s*(.+)/.exec(configText);
  const raw = m?.[1]?.trim();
  if (!raw) return undefined;
  const ssh = /^git@([^:]+):(.+?)(\.git)?$/.exec(raw);
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  if (raw.startsWith('https://') || raw.startsWith('http://')) return raw.replace(/\.git$/, '');
  return undefined;
}

export function projectRepoUrl(projectRoot: string): string | undefined {
  const cfg = join(projectRoot, '.git', 'config');
  if (!existsSync(cfg)) return undefined;
  return originUrlFromConfig(readFileSync(cfg, 'utf-8'));
}

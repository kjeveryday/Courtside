// Evidence route (TASK-28): artifactRefs carried by events and gate meta open
// as files. Confined under the plan dir, extension-allowlisted, read-only.
// R8 still holds: evidence opens for the human's eyes — it never verifies.
import { extname, join, normalize, sep } from 'node:path';

const ALLOWED = new Set(['.log', '.txt', '.md', '.json', '.png']);

export function safeArtifactPath(planDir: string, url: string): string | undefined {
  const raw = decodeURIComponent((url.split('?')[0] ?? '').replace(/^\/api\/artifact\//, ''));
  // refs are written both plan-relative ("artifacts/x.log") and repo-relative
  // ("plan/artifacts/x.log") — accept either, resolve under planDir
  const rel = raw.startsWith('plan/') ? raw.slice('plan/'.length) : raw;
  if (!ALLOWED.has(extname(rel))) return undefined;
  if (rel.split('/').some((part) => part.startsWith('.'))) return undefined;
  const resolved = normalize(join(planDir, rel));
  if (!resolved.startsWith(planDir + sep)) return undefined;
  return resolved;
}

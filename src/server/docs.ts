// Source-doc serving (DEC-30): sourceRefs like `gdd.md#movement-ranges` resolve
// against the consuming project's root (the plan dir's parent). Markdown only,
// confined — no traversal, no hidden dirs, no node_modules. plan/*.md serves too:
// specs, backlog, and gate reports ARE source docs for plan-internal refs.
import { dirname, join, normalize, sep } from 'node:path';

export function safeDocPath(planDir: string, url: string): string | undefined {
  const raw = decodeURIComponent((url.split('?')[0] ?? '').replace(/^\/api\/doc\//, ''));
  if (!raw.endsWith('.md')) return undefined;
  if (raw.split('/').some((part) => part.startsWith('.') || part === 'node_modules'))
    return undefined;
  const projectRoot = dirname(planDir);
  const resolved = normalize(join(projectRoot, raw));
  if (!resolved.startsWith(projectRoot + sep)) return undefined;
  return resolved;
}

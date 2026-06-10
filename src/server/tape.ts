// F17 Game Tape viewer (server half): file facts Courtside verifies itself
// (existence, mtime, size — §5 verified provenance) and a confined file route.
// R8: nothing here can check a verify step; tape is evidence, never verification.
import { existsSync, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';

export type TapeFrame = {
  ref: string;
  exists: boolean;
  mtime?: string;
  size?: number;
  url?: string;
};

const relToPlan = (p: string) => (p.startsWith('plan/') ? p.slice('plan/'.length) : p);

export function resolveTape(planDir: string, refs: readonly string[]): TapeFrame[] {
  return refs.map((ref) => {
    const path = join(planDir, relToPlan(ref));
    if (!existsSync(path)) return { ref, exists: false };
    const st = statSync(path);
    return {
      ref,
      exists: true,
      mtime: st.mtime.toISOString(),
      size: st.size,
      url: `/api/tape/${relToPlan(ref).replace(/^tape\//, '')}`,
    };
  });
}

// /api/tape/<sub> → <planDir>/tape/<sub>, never escaping the tape dir.
export function safeTapePath(planDir: string, url: string): string | undefined {
  const raw = decodeURIComponent((url.split('?')[0] ?? '').replace(/^\/api\/tape\//, ''));
  const tapeRoot = join(planDir, 'tape');
  const resolved = normalize(join(tapeRoot, raw));
  if (!resolved.startsWith(tapeRoot + sep)) return undefined;
  return resolved;
}

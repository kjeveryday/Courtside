// Pure derivations for S3 views (vitest-first). Inputs are structural subsets of
// the generated contract types so tests stay light; UI passes real state slices.
type TaskLike = { id: string; deps?: string[] };

// Dependency depth per task: 0 for roots/unknown deps; cycles cap at task count.
export function depsDepth(tasks: readonly TaskLike[]): Map<string, number> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const limit = tasks.length;

  const walk = (id: string, hops: number): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    const t = byId.get(id);
    if (!t || visiting.has(id) || hops > limit) return 0;
    visiting.add(id);
    const parents = (t.deps ?? []).filter((d) => byId.has(d));
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map((p) => walk(p, hops + 1)));
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };

  for (const t of tasks) walk(t.id, 0);
  return depth;
}

export type DayPoint = { day: string; count: number };

// Cumulative count of timestamps grouped by local day, ascending.
export function cumulativeByDay(isoTimestamps: readonly string[]): DayPoint[] {
  const perDay = new Map<string, number>();
  for (const iso of isoTimestamps) {
    const day = new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD, local
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  let total = 0;
  return [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, n]) => {
      total += n;
      return { day, count: total };
    });
}

export type Tone = 'ok' | 'muted' | 'risk';

// Ledger age indicator: old enough to itch renders risk (mock's "6d — itching").
export function ageBucket(iso: string, nowMs: number = Date.now()): Tone {
  const days = (nowMs - new Date(iso).getTime()) / 86_400_000;
  return days >= 3 ? 'risk' : 'muted';
}

// State freshness (R1): ok < 1 h · muted < 24 h · risk (stale) after / missing.
export function freshness(iso: string | undefined, nowMs: number = Date.now()): Tone {
  if (!iso) return 'risk';
  const hours = (nowMs - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return 'ok';
  if (hours < 24) return 'muted';
  return 'risk';
}

// F3 progress: milestone bar for the active slice + cumulative-decisions sparkline.
import type { CourtsideState } from '../contract/state.generated';
import { cumulativeByDay } from '../lib/derive';

function Sparkline({ points }: { points: { day: string; count: number }[] }) {
  if (points.length === 0) return <p className="text-xs text-muted">no decisions yet</p>;
  // one day of data draws as an invisible dot — say what's true instead
  if (points.length === 1)
    return (
      <p className="mt-1 text-xs text-muted">
        {points[0]!.count} on one day — a trend needs a second day
      </p>
    );
  const max = points.at(-1)!.count;
  const w = 120;
  const h = 24;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - (p.count / max) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-6 w-[120px]" aria-label="decisions over time">
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
    </svg>
  );
}

export function Progress({ state }: { state: CourtsideState }) {
  // Active slice when it has tasks; otherwise the whole board (real projects
  // often carry tasks across many slices).
  const inSlice = state.tasks.filter((t) => t.slice === state.slice);
  const sliceTasks = inSlice.length > 0 ? inSlice : state.tasks;
  const done = sliceTasks.filter((t) => t.status === 'done').length;
  const total = sliceTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const series = cumulativeByDay(state.decisions?.map((d) => d.decidedAt) ?? []);

  return (
    <section className="mb-5 rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        Milestone · {state.slice ?? '—'}
      </h2>
      <div className="h-2.5 overflow-hidden rounded-full border border-line bg-bg">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
        <span>{pct}%</span>
        <span>
          {done} of {total} tasks
        </span>
      </div>
      <div className="mt-3 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        Recent decisions over time
      </div>
      <Sparkline points={series} />
    </section>
  );
}

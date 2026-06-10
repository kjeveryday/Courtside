// Mock's signature "locked behind the gate" section, with v1.1 async-true copy:
// approval un-dims it, but the agent still acts next session (delta b).
import type { CourtsideState } from '../contract/state.generated';

export function NextUp({ state, gateApproved }: { state: CourtsideState; gateApproved: boolean }) {
  const upcoming = state.tasks.filter((t) => t.status === 'todo');
  if (upcoming.length === 0) return null;
  return (
    <section
      className={`mb-5 rounded-card border border-line bg-surface p-5 transition-[filter,opacity] duration-500 ${
        gateApproved ? '' : 'pointer-events-none opacity-45 grayscale'
      }`}
    >
      <h2 className="mb-2 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        Next up · {state.slice ?? ''}{' '}
        <span className="rounded-full border border-line bg-surface2 px-2 font-mono text-[11px]">
          {upcoming.length}
        </span>
      </h2>
      <p className={`mb-2.5 font-mono text-[11px] ${gateApproved ? 'text-ok' : 'text-accent'}`}>
        {gateApproved
          ? '▮ Gate cleared — agent picks this up next session'
          : '▮ Locked behind the gate above — clears when you approve'}
      </p>
      {upcoming.map((t) => (
        <div
          key={t.id}
          className="mb-2 flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5 last:mb-0"
        >
          <span className="font-mono text-[11px] text-muted">{t.id}</span>
          <span className="flex-1 text-sm">{t.title}</span>
          {t.logicOnly && (
            <span className="rounded border border-line bg-surface2 px-1.5 py-px font-mono text-[10px] text-muted">
              logic-only → {t.surfacesAt}
            </span>
          )}
          {t.risk && (
            <span className="rounded bg-accent/15 px-1.5 py-px font-mono text-[10px] text-accent">
              risk: {t.risk}
            </span>
          )}
        </div>
      ))}
    </section>
  );
}

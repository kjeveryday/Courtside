// F1 status board as the mock's scorebug strip — four contract-derived cells,
// copy-dieted per DEC-28: short labels, glyph badges, no duplicate task title.
import type { CourtsideState } from '../contract/state.generated';
import { formatAgo, humanizeAgentState, latestEventOfKind, localTime } from '../lib/format';
import { EventText } from './Provenance';

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-r border-line px-4 py-3 last:border-r-0 max-[860px]:border-r-0 max-[860px]:border-b max-[860px]:last:border-b-0">
      <div className="mb-0.5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

export function Scorebug({ state }: { state: CourtsideState }) {
  const { agent } = state;
  const waiting = agent.state === 'parked_at_gate' || agent.state === 'blocked';
  const currentTask = state.tasks.find((t) => t.id === agent.currentTask);
  const lastRun = latestEventOfKind(state.events, 'test_run');

  return (
    <div
      role="status"
      className="my-5 grid grid-cols-[auto_1fr_auto_auto] overflow-hidden rounded-card border border-line bg-surface max-[860px]:grid-cols-1"
    >
      <Cell label="Agent">
        <div
          className={`font-display text-[20px] leading-tight font-semibold ${waiting ? 'text-accent' : ''}`}
        >
          {waiting && (
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
          )}
          {humanizeAgentState(agent.state)}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {localTime(agent.since)} · {formatAgo(agent.since)}
        </div>
      </Cell>
      <Cell label="Narration">
        <div className="text-sm">
          {agent.narration ? <EventText provenance="claimed" text={agent.narration} /> : '—'}
        </div>
      </Cell>
      <Cell label="Task">
        <div className="font-display text-[20px] leading-tight font-semibold">
          {agent.currentTask ?? '—'}
        </div>
        <div className="mt-0.5 font-mono text-xs text-muted">{currentTask?.status ?? '—'}</div>
      </Cell>
      <Cell label="Tests">
        <div className="max-w-56 text-sm">
          {lastRun ? <EventText provenance={lastRun.provenance} text={lastRun.text} /> : '—'}
        </div>
        <div className="mt-0.5 text-xs text-muted">{lastRun ? formatAgo(lastRun.ts) : ''}</div>
      </Cell>
    </div>
  );
}

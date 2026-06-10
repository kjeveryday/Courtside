// F1 status board as the mock's scorebug strip — four contract-derived cells.
// Delta vs mock (recorded in spec §B3): no "Session" cell; the v0 contract has no
// session data and we don't invent any (SQLite sessions arrive S4).
import type { CourtsideState } from '../contract/state.generated';
import { formatAgo, humanizeAgentState, latestEventOfKind, localTime } from '../lib/format';
import { EventText } from './Provenance';

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-r border-line px-5 py-3.5 last:border-r-0 max-[860px]:border-r-0 max-[860px]:border-b max-[860px]:last:border-b-0">
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
          className={`font-display text-[22px] leading-tight font-semibold ${waiting ? 'text-accent' : ''}`}
        >
          {waiting && (
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
          )}
          {humanizeAgentState(agent.state)}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          since {localTime(agent.since)} · {formatAgo(agent.since)}
        </div>
      </Cell>
      <Cell label="Last narration">
        <div className="text-sm font-medium">
          {agent.narration ? <EventText provenance="claimed" text={agent.narration} /> : '—'}
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {currentTask ? `${currentTask.id} · ${currentTask.title}` : (agent.currentTask ?? '—')}
        </div>
      </Cell>
      <Cell label="Active task">
        <div className="font-display text-[22px] leading-tight font-semibold">
          {agent.currentTask ?? '—'}
        </div>
        <div className="mt-0.5 font-mono text-xs text-muted">
          {currentTask
            ? `${currentTask.status}${currentTask.risk ? ` · risk ${currentTask.risk}` : ''}`
            : '—'}
        </div>
      </Cell>
      <Cell label="Last test run">
        <div className="max-w-56 text-sm font-medium">
          {lastRun ? (
            <EventText provenance={lastRun.provenance} text={lastRun.text} />
          ) : (
            'no runs recorded'
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">{lastRun ? formatAgo(lastRun.ts) : '—'}</div>
      </Cell>
    </div>
  );
}

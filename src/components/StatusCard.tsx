// Agent detail card (main column). Narration is agent-authored → EventText
// hard-wires it as claimed (rule 14); the card never renders a bare claim.
import type { CourtsideState } from '../contract/state.generated';
import { humanizeAgentState, localTime } from '../lib/format';
import { EventText } from './Provenance';

export function StatusCard({ state }: { state: CourtsideState }) {
  const { agent } = state;
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">Agent</p>
      <p className="mt-1 font-display text-[22px] font-semibold">
        {humanizeAgentState(agent.state)}
        <span className="ml-2 font-body text-sm font-normal text-muted">
          since {localTime(agent.since)}
        </span>
      </p>
      {agent.narration && (
        <p className="mt-2 text-sm italic">
          <EventText provenance="claimed" text={agent.narration} />
        </p>
      )}
      {agent.currentTask && (
        <p className="mt-2 font-mono text-xs text-muted">{agent.currentTask}</p>
      )}
    </section>
  );
}

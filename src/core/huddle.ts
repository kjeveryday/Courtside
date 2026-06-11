// F20 Tier 1 — the deterministic Huddle. Template-generated diff from state +
// decision log + last-seen. Zero AI, zero cost, can't hallucinate (PRD). Facts
// carry their own provenance: structural reads are verified; anything echoing
// the agent's self-report stays claimed.
import type { CourtsideState } from '../contract/state.generated.ts';
import { formatAgo, humanizeAgentState, localTime } from '../lib/format.ts';

export type HuddleFact = {
  text: string;
  kind: 'shipped' | 'waiting' | 'question' | 'agent' | 'quiet';
  provenance: 'verified' | 'claimed';
};
export type Huddle = { sinceLabel: string; facts: HuddleFact[] };

type LoggedDecision = { ts: string; gateId?: string; decision?: string };

export function buildHuddle(
  state: CourtsideState,
  decisionLog: readonly LoggedDecision[],
  lastSeenIso: string,
  nowMs: number = Date.now(),
  // gates that already have a decision in the inbox are NOT waiting on the human
  decidedGateIds: readonly string[] = [],
): Huddle {
  const since = new Date(lastSeenIso).getTime();
  const facts: HuddleFact[] = [];

  const shippedDecisions = (state.decisions ?? []).filter(
    (d) => new Date(d.decidedAt).getTime() > since,
  );
  const shippedTasks = [
    ...new Set(
      shippedDecisions
        .map((d) => d.gateId?.match(/TASK-\d+/)?.[0])
        .filter((t): t is string => Boolean(t)),
    ),
  ];
  if (shippedTasks.length > 0)
    facts.push({
      kind: 'shipped',
      provenance: 'verified',
      text: `${shippedTasks.length} task${shippedTasks.length > 1 ? 's' : ''} shipped (${shippedTasks.join(', ')})`,
    });

  const newDecisions = decisionLog.filter((d) => new Date(d.ts).getTime() > since);
  if (newDecisions.length > 0)
    facts.push({
      kind: 'shipped',
      provenance: 'verified',
      text: `${newDecisions.length} decision${newDecisions.length > 1 ? 's' : ''} you made landed in the inbox (${newDecisions.map((d) => d.gateId).join(', ')})`,
    });

  for (const gate of state.gates.filter(
    (g) => g.status === 'pending' && !decidedGateIds.includes(g.id),
  ))
    facts.push({
      kind: 'waiting',
      provenance: 'verified',
      text: `1 gate waiting on you — ${gate.id}, posted ${formatAgo(gate.postedAt, nowMs)}`,
    });

  for (const q of (state.questions ?? []).filter((q) => q.status === 'open'))
    facts.push({
      kind: 'question',
      provenance: 'verified',
      text: `${q.id} still open, ${formatAgo(q.openedAt, nowMs)}${q.blocking?.length ? `, blocking ${q.blocking.join(', ')}` : ''}`,
    });

  facts.push({
    kind: 'agent',
    // the agent's own account of itself — never dress it as a checked fact
    provenance: 'claimed',
    text: `agent ${humanizeAgentState(state.agent.state)} since ${localTime(state.agent.since)} (${formatAgo(state.agent.since, nowMs)})`,
  });

  if (facts.length === 1 && state.agent.state === 'idle')
    facts.unshift({
      kind: 'quiet',
      provenance: 'verified',
      text: "you're caught up — nothing happened since you last looked",
    });

  return { sinceLabel: `since you last looked (${formatAgo(lastSeenIso, nowMs)})`, facts };
}

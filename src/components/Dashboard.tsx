// The ok-phase layout: scorebug on top, gate(s) + backlog in the main column,
// progress / ticker / ledgers in the side column. Split from App (rule-12 size).
import type { CourtsideState } from '../contract/state.generated';
import { postDispatch, type GateView, type PendingDispatch, type RunningAgent } from '../lib/api';
import { Backlog } from './Backlog';
import { GateCard } from './Gate';
import { Ledgers } from './Ledgers';
import { NextUp } from './NextUp';
import { Progress } from './Progress';
import { Scorebug } from './Scorebug';
import type { DispatchApi } from './SendToAgent';
import { Ticker } from './Ticker';

export function Dashboard({
  state,
  gates,
  token,
  dispatches,
  runningAgents,
  decisionError,
  onDecisionError,
  onOpenDoc,
}: {
  state: CourtsideState;
  gates: GateView[];
  token: string;
  dispatches: PendingDispatch[];
  runningAgents: RunningAgent[];
  decisionError: string;
  onDecisionError: (msg: string) => void;
  onOpenDoc: (ref: string) => void;
}) {
  const pendingOrDecided = gates.filter((g) => g.gate.status === 'pending');
  const anyApproved = pendingOrDecided.some((g) => g.decided?.decision === 'approve');
  const dispatch: DispatchApi = {
    stateOf: (kind, id) =>
      runningAgents.some((r) => r.id === id && r.status === 'running')
        ? 'running'
        : dispatches.some((d) => d.kind === kind && d.id === id)
          ? 'queued'
          : 'idle',
    send: (kind, id, answer, context) => postDispatch(token, { kind, id, answer, context }),
  };
  return (
    <section>
      <Scorebug state={state} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-5 max-[860px]:grid-cols-1">
        <div>
          {decisionError && (
            <p className="mb-3 rounded border border-risk/40 bg-risk/10 px-3 py-2 text-xs text-risk">
              decision failed: {decisionError}
            </p>
          )}
          {pendingOrDecided.map((g) => (
            <GateCard
              key={g.gate.id}
              view={g}
              state={state}
              token={token}
              onDecisionError={onDecisionError}
              onOpenDoc={onOpenDoc}
            />
          ))}
          {pendingOrDecided.length > 0 && (
            <NextUp state={state} gateApproved={anyApproved} onOpenDoc={onOpenDoc} />
          )}
          <Backlog tasks={state.tasks} dispatch={dispatch} onOpenDoc={onOpenDoc} />
        </div>
        <aside>
          <Progress state={state} />
          <Ticker events={state.events} />
          <Ledgers state={state} dispatch={dispatch} />
        </aside>
      </div>
    </section>
  );
}

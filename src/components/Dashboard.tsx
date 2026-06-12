// The ok-phase layout: scorebug on top, gate(s) + backlog in the main column,
// progress / ticker / ledgers in the side column. Split from App (rule-12 size).
import type { CourtsideState } from '../contract/state.generated';
import {
  postDispatch,
  type AgentRun,
  type GateView,
  type PendingDispatch,
  type ServerEvent,
} from '../lib/api';
import { Backlog } from './Backlog';
import { GateCard } from './Gate';
import { HowTo } from './HowTo';
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
  agentRuns,
  serverEvents,
  repoUrl,
  decisionError,
  onDecisionError,
  onOpenDoc,
}: {
  state: CourtsideState;
  gates: GateView[];
  token: string;
  dispatches: PendingDispatch[];
  agentRuns: AgentRun[];
  serverEvents: ServerEvent[];
  repoUrl?: string;
  decisionError: string;
  onDecisionError: (msg: string) => void;
  onOpenDoc: (ref: string) => void;
}) {
  const pendingOrDecided = gates.filter((g) => g.gate.status === 'pending');
  const anyApproved = pendingOrDecided.some((g) => g.decided?.decision === 'approve');
  const runOf = (kind: string, id: string) => agentRuns.find((r) => r.kind === kind && r.id === id);
  const dispatch: DispatchApi = {
    stateOf: (kind, id) => {
      const run = runOf(kind, id);
      if (run?.status === 'running') return 'running';
      const queued = dispatches.some((d) => d.kind === kind && d.id === id);
      // a launch that died with its directive still in the inbox must say so
      if (queued && run?.status === 'failed') return 'failed';
      return queued ? 'queued' : 'idle';
    },
    runOf,
    send: (kind, id, answer, context) => postDispatch(token, { kind, id, answer, context }),
  };
  return (
    <section>
      <HowTo />
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
          <Backlog
            tasks={state.tasks}
            dispatch={dispatch}
            onOpenDoc={onOpenDoc}
            repoUrl={repoUrl}
          />
        </div>
        <aside>
          <Progress state={state} />
          <Ticker events={state.events} serverEvents={serverEvents} token={token} />
          <Ledgers state={state} dispatch={dispatch} repoUrl={repoUrl} />
        </aside>
      </div>
    </section>
  );
}

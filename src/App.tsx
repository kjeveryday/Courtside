// App shell: token gate → /api/state → validated render or refusal (PRD §5).
// Data arrives from the Courtside server (S4); live WS updates land in TASK-12.
import { useEffect, useState } from 'react';
import { Backlog } from './components/Backlog';
import { GateCard } from './components/Gate';
import { HarnessBar } from './components/HarnessBar';
import { Header } from './components/Header';
import { Ledgers } from './components/Ledgers';
import { NextUp } from './components/NextUp';
import { Progress } from './components/Progress';
import { Scorebug } from './components/Scorebug';
import { StatusCard } from './components/StatusCard';
import { Ticker } from './components/Ticker';
import type { CourtsideState } from './contract/state.generated';
import { validateState } from './contract/validate';
import {
  connectWs,
  ensureToken,
  fetchState,
  type GateView,
  type StatePayload,
  type WsStatus,
} from './lib/api';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'locked'; detail: string }
  | { phase: 'ok'; state: CourtsideState; gates: GateView[]; token: string; harness: boolean }
  | { phase: 'refused'; errors: string[] };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });
  const [ws, setWs] = useState<WsStatus>('connecting');
  const [decisionError, setDecisionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const apply = (next: LoadState) => {
      if (!cancelled) setLoad(next);
    };
    const token = ensureToken();
    // One trust path for first fetch and every live push: validate locally,
    // render fully or refuse (PRD §5).
    const applyPayload = ({ result, gates, harness }: StatePayload) => {
      if (!result.ok) return apply({ phase: 'refused', errors: result.errors });
      const checked = validateState(result.state);
      if (checked.ok)
        apply({
          phase: 'ok',
          state: checked.state,
          gates: gates ?? [],
          token: token ?? '',
          harness: harness ?? false,
        });
      else apply({ phase: 'refused', errors: checked.errors });
    };
    if (!token) {
      apply({ phase: 'locked', detail: 'no token stored in this browser yet' });
      return;
    }
    let disconnect = () => {};
    (async () => {
      const outcome = await fetchState(token);
      if (cancelled) return;
      if (outcome.kind === 'unauthorized')
        return apply({ phase: 'locked', detail: 'the server rejected the stored token' });
      if (outcome.kind === 'network')
        return apply({ phase: 'refused', errors: [`/api/state — ${outcome.detail}`] });
      applyPayload(outcome.payload);
      disconnect = connectWs(token, applyPayload, (s) => {
        if (!cancelled) setWs(s);
      });
    })();
    return () => {
      cancelled = true;
      disconnect();
    };
  }, []);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-16">
      <Header
        phase={load.phase === 'ok' ? load.state.phase : undefined}
        slice={load.phase === 'ok' ? load.state.slice : undefined}
        live={load.phase === 'ok' || load.phase === 'refused' ? ws : undefined}
      />
      <div className="mt-5">
        {load.phase === 'loading' && <p className="text-sm text-muted">loading state…</p>}
        {load.phase === 'locked' && <LockedOut detail={load.detail} />}
        {load.phase === 'ok' && (
          <ValidState
            state={load.state}
            gates={load.gates}
            token={load.token}
            decisionError={decisionError}
            onDecisionError={setDecisionError}
          />
        )}
        {load.phase === 'refused' && <RefusalState errors={load.errors} />}
      </div>
      {load.phase === 'ok' && load.harness && <HarnessBar token={load.token} />}
    </main>
  );
}

function ValidState({
  state,
  gates,
  token,
  decisionError,
  onDecisionError,
}: {
  state: CourtsideState;
  gates: GateView[];
  token: string;
  decisionError: string;
  onDecisionError: (msg: string) => void;
}) {
  const pendingOrDecided = gates.filter((g) => g.gate.status === 'pending');
  const anyApproved = pendingOrDecided.some((g) => g.decided?.decision === 'approve');
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
            />
          ))}
          {pendingOrDecided.length > 0 && <NextUp state={state} gateApproved={anyApproved} />}
          <StatusCard state={state} />
          <Backlog tasks={state.tasks} />
        </div>
        <aside>
          <Progress state={state} />
          <Ticker events={state.events} />
          <Ledgers state={state} />
        </aside>
      </div>
    </section>
  );
}

function LockedOut({ detail }: { detail: string }) {
  return (
    <section className="rounded-card border border-accent/50 bg-surface p-6">
      <p className="font-display text-xl font-semibold text-accent">Locked — token required</p>
      <p className="mt-2 text-sm text-muted">
        This dashboard authenticates with a token printed when the server starts ({detail}). Start
        it with <span className="font-mono">npm run dev</span> and open the printed{' '}
        <span className="font-mono">http://127.0.0.1:4310/?token=…</span> link.
      </p>
    </section>
  );
}

function RefusalState({ errors }: { errors: string[] }) {
  return (
    <section>
      <p className="font-medium text-risk">state invalid ✗ — refusing to render</p>
      <ul className="mt-3 space-y-1 rounded-card border border-risk/40 bg-risk/10 p-4 font-mono text-xs text-risk">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Invalid state never renders as truth (PRD §5). Fix the watched file; this view recovers
        automatically once it validates.
      </p>
    </section>
  );
}

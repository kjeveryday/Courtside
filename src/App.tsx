// App shell: token gate → /api/state → validated render or refusal (PRD §5).
// Data arrives from the Courtside server (S4); live WS updates land in TASK-12.
import { useEffect, useState } from 'react';
import { Backlog } from './components/Backlog';
import { GateCard } from './components/Gate';
import { HarnessBar } from './components/HarnessBar';
import { Header } from './components/Header';
import { HealthBadge, PreflightPanel, type DoctorReport } from './components/Health';
import { HuddleButton, HuddlePanel, type HuddleData } from './components/Huddle';
import { Ledgers } from './components/Ledgers';
import { NextUp } from './components/NextUp';
import { Progress } from './components/Progress';
import { Scorebug } from './components/Scorebug';
import { LockedOut, RefusalState } from './components/Screens';
import { Ticker } from './components/Ticker';
import type { CourtsideState } from './contract/state.generated';
import { validateState } from './contract/validate';
import {
  connectWs,
  ensureToken,
  fetchDoctor,
  fetchHuddle,
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
  const [doctor, setDoctor] = useState<DoctorReport | null>(null);
  const [showPreflight, setShowPreflight] = useState(false);
  const [huddle, setHuddle] = useState<HuddleData | null>(null);

  const refreshDoctor = (token: string) => {
    void fetchDoctor(token).then((r) => setDoctor(r as DoctorReport | null));
  };
  const openHuddle = () => {
    const token = ensureToken();
    if (token) void fetchHuddle(token).then((r) => setHuddle(r as HuddleData | null));
  };

  useEffect(() => {
    let cancelled = false;
    const apply = (next: LoadState) => {
      if (!cancelled) setLoad(next);
    };
    const token = ensureToken();
    // One trust path for first fetch and every live push: validate locally,
    // render fully or refuse (PRD §5).
    const applyPayload = ({ result, gates, harness }: StatePayload) => {
      if (token) refreshDoctor(token); // health decays live (F0)
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
        health={
          <span className="flex items-center gap-3">
            <HealthBadge
              report={doctor}
              open={showPreflight}
              onToggle={() => setShowPreflight((v) => !v)}
            />
            {load.phase === 'ok' && <HuddleButton onOpen={openHuddle} />}
          </span>
        }
      />
      {huddle && (
        <div className="mt-5">
          <HuddlePanel data={huddle} onClose={() => setHuddle(null)} />
        </div>
      )}
      {showPreflight && doctor && (
        <div className="mt-5">
          <PreflightPanel
            report={doctor}
            onRerun={() => {
              const token = ensureToken();
              if (token) refreshDoctor(token);
            }}
          />
        </div>
      )}
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

// App shell: token gate → /api/state → validated render or refusal (PRD §5).
// Data arrives from the Courtside server (S4); live WS updates land in TASK-12.
import { useEffect, useState } from 'react';
import { HarnessBar } from './components/HarnessBar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DocViewer } from './components/DocViewer';
import { HealthBadge, PreflightPanel, type DoctorReport } from './components/Health';
import { HuddleButton, HuddlePanel, type HuddleData } from './components/Huddle';
import { Legend } from './components/Legend';
import { LockedOut, RefusalState } from './components/Screens';
import type { CourtsideState } from './contract/state.generated';
import { validateState } from './contract/validate';
import {
  connectWs,
  ensureToken,
  fetchDoc,
  fetchDoctor,
  fetchHuddle,
  fetchState,
  type AgentRun,
  type GateView,
  type PendingDispatch,
  type ServerEvent,
  type StatePayload,
  type WsStatus,
} from './lib/api';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'locked'; detail: string }
  | {
      phase: 'ok';
      state: CourtsideState;
      gates: GateView[];
      token: string;
      harness: boolean;
      dispatches: PendingDispatch[];
      agentRuns: AgentRun[];
      serverEvents: ServerEvent[];
    }
  | { phase: 'refused'; errors: string[] };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });
  const [ws, setWs] = useState<WsStatus>('connecting');
  const [decisionError, setDecisionError] = useState('');
  const [doctor, setDoctor] = useState<DoctorReport | null>(null);
  const [showPreflight, setShowPreflight] = useState(false);
  const [huddle, setHuddle] = useState<HuddleData | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [docView, setDocView] = useState<{
    ref: string;
    text: string | null;
    error: string | null;
  } | null>(null);

  const openDoc = (ref: string) => {
    setDocView({ ref, text: null, error: null });
    const token = ensureToken();
    if (!token) return;
    void fetchDoc(token, ref).then((r) =>
      setDocView((cur) =>
        cur?.ref === ref
          ? { ref, text: 'text' in r ? r.text : null, error: 'error' in r ? r.error : null }
          : cur,
      ),
    );
  };

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
    const applyPayload = (payload: StatePayload) => {
      const { result, gates, harness, dispatches, agentRuns, serverEvents } = payload;
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
          dispatches: dispatches ?? [],
          agentRuns: agentRuns ?? [],
          serverEvents: serverEvents ?? [],
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
            <button
              onClick={() => setShowLegend((v) => !v)}
              title="legend — what the chips, dots, and badges mean"
              className="rounded-full border border-line bg-surface2 px-2 py-1 font-mono text-[11px] text-muted"
            >
              ?
            </button>
          </span>
        }
      />
      {showLegend && (
        <div className="mt-5">
          <Legend onClose={() => setShowLegend(false)} />
        </div>
      )}
      {docView && (
        <div className="mt-5">
          <DocViewer
            docRef={docView.ref}
            text={docView.text}
            error={docView.error}
            onClose={() => setDocView(null)}
          />
        </div>
      )}
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
          <Dashboard
            state={load.state}
            gates={load.gates}
            token={load.token}
            dispatches={load.dispatches}
            agentRuns={load.agentRuns}
            serverEvents={load.serverEvents}
            decisionError={decisionError}
            onDecisionError={setDecisionError}
            onOpenDoc={openDoc}
          />
        )}
        {load.phase === 'refused' && <RefusalState errors={load.errors} />}
      </div>
      {load.phase === 'ok' && load.harness && <HarnessBar token={load.token} />}
    </main>
  );
}

// App shell: token gate → /api/state → validated render or refusal (PRD §5).
// Data arrives from the Courtside server (S4); live WS updates land in TASK-12.
import { useEffect, useState } from 'react';
import { Backlog } from './components/Backlog';
import { Header } from './components/Header';
import { Ledgers } from './components/Ledgers';
import { Progress } from './components/Progress';
import { Scorebug } from './components/Scorebug';
import { StatusCard } from './components/StatusCard';
import { Ticker } from './components/Ticker';
import type { CourtsideState } from './contract/state.generated';
import { validateState } from './contract/validate';
import { ensureToken, fetchState } from './lib/api';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'locked'; detail: string }
  | { phase: 'ok'; state: CourtsideState }
  | { phase: 'refused'; errors: string[] };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const apply = (next: LoadState) => {
      if (!cancelled) setLoad(next);
    };
    const token = ensureToken();
    if (!token) {
      apply({ phase: 'locked', detail: 'no token stored in this browser yet' });
      return;
    }
    (async () => {
      const outcome = await fetchState(token);
      if (outcome.kind === 'unauthorized')
        return apply({ phase: 'locked', detail: 'the server rejected the stored token' });
      if (outcome.kind === 'network')
        return apply({ phase: 'refused', errors: [`/api/state — ${outcome.detail}`] });
      const { result } = outcome.payload;
      if (!result.ok) return apply({ phase: 'refused', errors: result.errors });
      // Server already validated; re-validate locally so the UI's trust is its own.
      const checked = validateState(result.state);
      if (checked.ok) apply({ phase: 'ok', state: checked.state });
      else apply({ phase: 'refused', errors: checked.errors });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-16">
      <Header
        phase={load.phase === 'ok' ? load.state.phase : undefined}
        slice={load.phase === 'ok' ? load.state.slice : undefined}
      />
      <div className="mt-5">
        {load.phase === 'loading' && <p className="text-sm text-muted">loading state…</p>}
        {load.phase === 'locked' && <LockedOut detail={load.detail} />}
        {load.phase === 'ok' && <ValidState state={load.state} />}
        {load.phase === 'refused' && <RefusalState errors={load.errors} />}
      </div>
    </main>
  );
}

function ValidState({ state }: { state: CourtsideState }) {
  return (
    <section>
      <Scorebug state={state} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-5 max-[860px]:grid-cols-1">
        <div>
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

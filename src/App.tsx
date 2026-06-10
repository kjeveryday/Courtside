// Fetch → validate → render the typed state, or the refusal state (PRD §5:
// invalid state never renders as truth — no partial data). Token-styled per
// docs/mock.html design language (TASK-4); scorebug/ticker arrive TASK-5/6.
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Scorebug } from './components/Scorebug';
import { StatusCard } from './components/StatusCard';
import { Ticker } from './components/Ticker';
import type { CourtsideState } from './contract/state.generated';
import { validateState } from './contract/validate';

const FIXTURE_URL = '/fixtures/state.sample.json';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ok'; state: CourtsideState }
  | { phase: 'refused'; errors: string[] };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const apply = (next: LoadState) => {
      if (!cancelled) setLoad(next);
    };

    (async () => {
      try {
        const res = await fetch(FIXTURE_URL);
        if (!res.ok) {
          apply({ phase: 'refused', errors: [`${FIXTURE_URL} — HTTP ${res.status}`] });
          return;
        }
        let data: unknown;
        try {
          data = await res.json();
        } catch (err) {
          const detail = err instanceof Error ? err.message : String(err);
          apply({ phase: 'refused', errors: [`${FIXTURE_URL} — not valid JSON: ${detail}`] });
          return;
        }
        const result = validateState(data);
        if (result.ok) apply({ phase: 'ok', state: result.state });
        else apply({ phase: 'refused', errors: result.errors });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        apply({ phase: 'refused', errors: [`${FIXTURE_URL} — fetch failed: ${detail}`] });
      }
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
        {load.phase === 'loading' && <p className="text-sm text-muted">loading fixture…</p>}
        {load.phase === 'ok' && <ValidState state={load.state} />}
        {load.phase === 'refused' && <RefusalState errors={load.errors} />}
      </div>
    </main>
  );
}

function ValidState({ state }: { state: CourtsideState }) {
  return (
    <section>
      <p className="font-mono text-xs text-ok">fixture validates ✓ {state.schema}</p>
      <Scorebug state={state} />
      <div className="grid grid-cols-[1.6fr_1fr] gap-5 max-[860px]:grid-cols-1">
        <div>
          <StatusCard state={state} />
        </div>
        <aside>
          <Ticker events={state.events} />
        </aside>
      </div>
    </section>
  );
}

function RefusalState({ errors }: { errors: string[] }) {
  return (
    <section>
      <p className="font-medium text-risk">fixture invalid ✗ — refusing to render state</p>
      <ul className="mt-3 space-y-1 rounded-card border border-risk/40 bg-risk/10 p-4 font-mono text-xs text-risk">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Invalid state never renders as truth (PRD §5). Fix the file; this page re-checks on reload.
      </p>
    </section>
  );
}

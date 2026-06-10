// TASK-3: fixture status page. Fetch → validate → render the typed state, or the
// refusal state (PRD §5: invalid state never renders as truth — no partial data).
// Design tokens/fonts are S2; this page is deliberately plain.
import { useEffect, useState } from 'react';
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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="border-l-4 border-amber-500 pl-4 text-3xl font-bold tracking-tight">
        Courtside
      </h1>
      <div className="mt-6">
        {load.phase === 'loading' && <p className="text-sm text-neutral-500">loading fixture…</p>}
        {load.phase === 'ok' && <ValidState state={load.state} />}
        {load.phase === 'refused' && <RefusalState errors={load.errors} />}
      </div>
    </main>
  );
}

function ValidState({ state }: { state: CourtsideState }) {
  const { agent } = state;
  const since = new Date(agent.since).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <section>
      <p className="font-medium text-green-700">fixture validates ✓ {state.schema}</p>
      <p className="mt-3 inline-block rounded-full border border-neutral-300 px-3 py-0.5 text-xs text-neutral-600">
        phase {state.phase}
        {state.slice ? ` · ${state.slice}` : ''}
      </p>
      <div className="mt-4 rounded-md border border-neutral-200 p-4">
        <p className="text-xs tracking-wide text-neutral-500 uppercase">Agent</p>
        <p className="mt-1 text-lg font-semibold">
          {agent.state.replace(/_/g, ' ')}
          <span className="ml-2 text-sm font-normal text-neutral-500">since {since}</span>
        </p>
        {agent.narration && (
          <p className="mt-2 text-sm text-neutral-700 italic">{agent.narration}</p>
        )}
        {agent.currentTask && (
          <p className="mt-2 font-mono text-xs text-neutral-500">{agent.currentTask}</p>
        )}
      </div>
    </section>
  );
}

function RefusalState({ errors }: { errors: string[] }) {
  return (
    <section>
      <p className="font-medium text-red-700">fixture invalid ✗ — refusing to render state</p>
      <ul className="mt-3 space-y-1 rounded-md border border-red-200 bg-red-50 p-4 font-mono text-xs text-red-800">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-neutral-500">
        Invalid state never renders as truth (PRD §5). Fix the file; this page re-checks on reload.
      </p>
    </section>
  );
}

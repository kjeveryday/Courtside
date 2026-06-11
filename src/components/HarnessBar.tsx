// Demo strip (fixture project only): play the agent's half of the loop and reset
// the demo — no terminal needed. In real use neither button exists; the "next
// agent session" is the human launching their actual agent.
import { useState } from 'react';

export function HarnessBar({ token }: { token: string }) {
  const [last, setLast] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async (path: string) => {
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { actions?: string[]; reset?: boolean; error?: string };
      setLast(body.actions?.join(' · ') ?? (body.reset ? 'demo reset' : (body.error ?? '')));
    } catch (err) {
      setLast(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  };

  return (
    <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-4 font-mono text-[11px] text-muted">
      <span className="rounded border border-line bg-surface2 px-1.5 py-px text-[10px]">DEMO</span>
      <button
        onClick={() => post('/api/dev/agent-session')}
        disabled={busy}
        className="rounded border border-line bg-surface2 px-3 py-1.5 text-text disabled:opacity-40"
      >
        agent's next session ▸
      </button>
      <button
        onClick={() => post('/api/dev/reset')}
        disabled={busy}
        className="rounded border border-line bg-surface2 px-3 py-1.5 text-text disabled:opacity-40"
      >
        reset ↺
      </button>
      {last && <span className="min-w-0">{last}</span>}
    </footer>
  );
}

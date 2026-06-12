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
    <footer className="mt-8 border-t border-line pt-4">
      <p className="mb-3 text-[12px] text-muted">
        <span className="mr-2 rounded border border-line bg-surface2 px-1.5 py-px font-mono text-[10px]">
          DEMO
        </span>
        Approve the gate above, then click &ldquo;simulate AI session&rdquo; to see what the AI
        would do next — the board updates live without a page reload.
      </p>
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
        <button
          onClick={() => post('/api/dev/agent-session')}
          disabled={busy}
          className="rounded border border-line bg-surface2 px-3 py-1.5 text-text disabled:opacity-40"
        >
          simulate AI session ▸
        </button>
        <button
          onClick={() => post('/api/dev/reset')}
          disabled={busy}
          className="rounded border border-line bg-surface2 px-3 py-1.5 text-text disabled:opacity-40"
        >
          reset ↺
        </button>
        {last && <span className="min-w-0">{last}</span>}
      </div>
    </footer>
  );
}

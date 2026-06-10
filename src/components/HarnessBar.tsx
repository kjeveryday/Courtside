// Harness-only footer (spec B4): drives the fixture's "next agent session" from
// the browser so the full async cycle is demonstrable without a terminal.
// Renders ONLY when the server says it's serving the fixture project.
import { useState } from 'react';

export function HarnessBar({ token }: { token: string }) {
  const [last, setLast] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/dev/agent-session', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as { actions?: string[]; error?: string };
      setLast(body.actions?.join(' · ') ?? body.error ?? `HTTP ${res.status}`);
    } catch (err) {
      setLast(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  };

  return (
    <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-4 font-mono text-[11px] text-muted">
      <span className="rounded border border-line bg-surface2 px-1.5 py-px text-[10px]">
        HARNESS · fixture project
      </span>
      <button
        onClick={run}
        disabled={busy}
        className="rounded border border-line bg-surface2 px-3 py-1.5 text-text disabled:opacity-40"
      >
        simulate next agent session ▸
      </button>
      {last && <span className="min-w-0">{last}</span>}
      <span className="ml-auto">restart `npm run dev` to reset the demo</span>
    </footer>
  );
}

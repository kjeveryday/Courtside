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
        Approve the checkpoint above, then click &ldquo;simulate AI session&rdquo; to see what the
        AI would do next — the board updates live without a page reload.
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

      <div className="mt-6 rounded-card border border-accent/40 bg-surface p-4">
        <p className="text-[13px] font-semibold">Ready to use this for your own game?</p>
        <p className="mt-1 text-[12px] text-muted">
          This is a demo of someone else&apos;s project. To set up Courtside for your game:
        </p>
        <ol className="mt-2.5 space-y-2 text-[12px]">
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border border-line font-mono text-[9px] text-muted">
              1
            </span>
            <span>
              Stop this server{' '}
              <span className="rounded bg-surface2 px-1.5 py-px font-mono text-[11px]">Ctrl+C</span>{' '}
              in the terminal where you ran{' '}
              <span className="font-mono text-[11px]">npm run dev</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border border-line font-mono text-[9px] text-muted">
              2
            </span>
            <span>
              Run{' '}
              <span className="rounded bg-surface2 px-1.5 py-px font-mono text-[11px]">
                npm run dev:new
              </span>{' '}
              — a short wizard walks you through picking your project folder, naming your game, and
              connecting your AI
            </span>
          </li>
        </ol>
      </div>
    </footer>
  );
}

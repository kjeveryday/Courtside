// Ask Courtside (TASK-30, DEC-36): live Q&A over the board, the plan, the
// project docs, and the tool's own guide. Matches are ✓ (real sources, each
// openable); the prose answer — written by the user's own connected agent —
// is ◇, because prose is prose. Stays mounted while hidden so the
// conversation survives closing the panel.
import { useState } from 'react';
import { postAsk, type AskBearing } from '../lib/api';
import { EventText, ProvenanceBadge } from './Provenance';

type Entry = {
  q: string;
  pending?: boolean;
  answer?: string;
  answerError?: string;
  bearings: AskBearing[];
  agentConfigured?: boolean;
};

export function AskButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="rounded-full border border-line bg-surface2 px-3 py-1 font-mono text-[11px] text-text"
    >
      ask ▸
    </button>
  );
}

export function AskPanel({
  token,
  open,
  onClose,
  onOpenDoc,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
  onOpenDoc: (ref: string) => void;
}) {
  const [log, setLog] = useState<Entry[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft('');
    setBusy(true);
    setLog((l) => [...l, { q: question, pending: true, bearings: [] }]);
    const transcript = log
      .filter((e) => e.answer)
      .map((e) => ({ q: e.q, a: e.answer as string }))
      .slice(-4);
    const r = await postAsk(token, question, transcript);
    setLog((l) =>
      l.map((e, i) =>
        i === l.length - 1
          ? 'error' in r
            ? { q: question, answerError: r.error, bearings: [] }
            : { q: question, ...r }
          : e,
      ),
    );
    setBusy(false);
  };

  const last = log.at(-1);
  return (
    <section className={open ? 'mb-5 rounded-card border border-info/50 bg-surface p-5' : 'hidden'}>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          Ask Courtside
        </h2>
        <button onClick={onClose} className="font-mono text-[11px] text-muted underline">
          close
        </button>
      </div>
      {log.map((e, i) => (
        <div
          key={`${i}-${e.q.slice(0, 16)}`}
          className="border-t border-line py-2 first:border-t-0"
        >
          <p className="font-mono text-[11px] text-accent">you · {e.q}</p>
          {e.pending && <p className="mt-1 text-xs text-muted">looking…</p>}
          {e.answer && (
            <p className="mt-1.5 text-sm whitespace-pre-wrap">
              <EventText provenance="claimed" text={e.answer} />
            </p>
          )}
          {e.answerError && (
            <p className="mt-1.5 font-mono text-[11px] text-risk">agent: {e.answerError}</p>
          )}
          <ul className="mt-1">
            {(e.answer ? e.bearings.slice(0, 6) : e.bearings).map((b) => (
              <li
                key={`${b.source}-${b.text.slice(0, 24)}`}
                className="flex items-start gap-1.5 py-0.5 text-xs text-muted"
              >
                <span className="mt-px flex-none">
                  <ProvenanceBadge provenance="verified" />
                </span>
                <span className="min-w-0">
                  <span className="font-mono text-[10px]">{b.source}</span> — {b.text}
                  {b.ref && (
                    <button
                      onClick={() => onOpenDoc(b.ref as string)}
                      className="ml-1.5 font-mono text-[10px] text-info underline"
                    >
                      open ▸
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {last && !last.pending && last.agentConfigured === false && (
        <p className="text-[10.5px] text-muted">
          matches only — no agent connected (the doctor shows how)
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder="ask about the board, the plan, or the tool…"
          className="w-full rounded border border-line bg-surface2 px-2.5 py-2 text-xs"
        />
        <button
          onClick={() => void send()}
          disabled={busy || draft.trim() === ''}
          className="rounded-lg bg-accent px-3 py-1.5 font-mono text-[11px] font-semibold text-accent-ink disabled:opacity-35"
        >
          ask ▸
        </button>
      </div>
    </section>
  );
}

// DEC-29: the activate-the-agent control, shared by tasks and questions.
// Collapsed: one button. Expanded: optional context (+ answer for questions).
// After sending: a status chip — queued for the next session, or running now.
import { useState } from 'react';

export type DispatchState = 'idle' | 'queued' | 'running';

export type DispatchApi = {
  stateOf: (kind: 'task' | 'question', id: string) => DispatchState;
  send: (
    kind: 'task' | 'question',
    id: string,
    answer?: string,
    context?: string,
  ) => Promise<string | null>;
};

export function SendToAgent({
  state,
  options,
  requireAnswer,
  onSend,
}: {
  state: DispatchState;
  options?: string[];
  requireAnswer?: boolean;
  onSend: (answer: string | undefined, context: string | undefined) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (state === 'queued')
    return (
      <span className="rounded bg-accent/15 px-1.5 py-px font-mono text-[10px] text-accent">
        in agent inbox ▸ next session
      </span>
    );
  if (state === 'running')
    return (
      <span className="rounded bg-info/15 px-1.5 py-px font-mono text-[10px] text-info">
        agent running…
      </span>
    );

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-accent/60 px-2 py-0.5 font-mono text-[10px] text-accent"
      >
        send to agent ▸
      </button>
    );

  const send = async () => {
    setBusy(true);
    setError('');
    const err = await onSend(answer.trim() || undefined, context.trim() || undefined);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <span className="block w-full">
      {options && options.length > 0 && (
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => setAnswer(o)}
              className={`rounded border px-2 py-0.5 text-[11px] ${
                answer === o ? 'border-accent text-accent' : 'border-line text-muted'
              }`}
            >
              {o}
            </button>
          ))}
        </span>
      )}
      {requireAnswer && (
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="answer (pick above or write)"
          className="mt-1.5 w-full rounded border border-line bg-surface2 px-2 py-1 text-xs"
        />
      )}
      <input
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="context for the agent (optional)"
        className="mt-1.5 w-full rounded border border-line bg-surface2 px-2 py-1 text-xs"
      />
      <span className="mt-1.5 flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy || (requireAnswer && answer.trim() === '')}
          className="rounded bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-accent-ink disabled:opacity-35"
        >
          send ▸
        </button>
        <button
          onClick={() => setOpen(false)}
          className="font-mono text-[10px] text-muted underline"
        >
          cancel
        </button>
        {error && <span className="font-mono text-[10px] text-risk">{error}</span>}
      </span>
    </span>
  );
}

// The signature Gate card (F6 + F7 + F19, mock's interaction pattern with the
// v1.1 async deltas): verify checklist unlocks Approve; reject/request-changes
// require a comment; after deciding, the card settles into "decision logged ·
// agent acts next session" (delta b). Meta row badges are per-item (delta a).
import { useState } from 'react';
import type { CourtsideState } from '../contract/state.generated';
import { postDecision, type DecisionPost, type GateView } from '../lib/api';
import { EventText, ProvenanceBadge } from './Provenance';

type StepState = { text: string; checked: boolean; skippedReason: string; skipping: boolean };

export function GateCard({
  view,
  state,
  token,
  onDecisionError,
}: {
  view: GateView;
  state: CourtsideState;
  token: string;
  onDecisionError: (msg: string) => void;
}) {
  const { gate, payload, decided } = view;
  const task = state.tasks.find((t) => t.id === gate.taskId);
  const [steps, setSteps] = useState<StepState[]>(
    (gate.verifySteps ?? []).map((s) => ({
      text: s.text,
      checked: false,
      skippedReason: '',
      skipping: false,
    })),
  );
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = steps.every((s) => s.checked || s.skippedReason.trim() !== '');
  const rejections = (task?.rejections ?? 0) + (decided?.decision === 'reject' ? 1 : 0);
  const blocked = rejections >= 3;

  const decide = async (decision: DecisionPost['decision']) => {
    setBusy(true);
    const res = await postDecision(token, {
      gateId: gate.id,
      decision,
      comment,
      steps: steps.map((s) => ({
        text: s.text,
        checked: s.checked || undefined,
        skippedReason: s.skippedReason.trim() || undefined,
      })),
    });
    setBusy(false);
    if (!res.ok) onDecisionError(res.error);
    // success needs no local state: the inbox write triggers the watcher → ws push
  };

  return (
    <section className="relative mb-5 overflow-hidden rounded-card border border-accent bg-surface p-5 shadow-[0_0_0_4px_rgba(232,163,61,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(45deg,var(--color-accent),var(--color-accent)_10px,transparent_10px,transparent_20px)]" />
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="rounded border border-accent px-2 py-0.5 font-mono text-[11px] text-accent">
          {gate.id}
        </span>
        <span className="font-display text-[22px] font-semibold">
          {payload?.title ?? `Task review · ${gate.taskId ?? gate.type}`}
        </span>
        {rejections > 0 && (
          <span className="rounded bg-risk/15 px-1.5 py-px font-mono text-[10px] text-risk">
            {rejections}× rejected
          </span>
        )}
      </div>
      {payload?.sourceRef && (
        <p className="mt-1 text-[13px] text-muted">
          source: <span className="font-mono text-xs">{payload.sourceRef}</span>
        </p>
      )}

      {payload?.tldr && (
        <div className="mt-3 rounded-r-md border-l-[3px] border-accent bg-surface2 px-3.5 py-2.5 text-[13.5px]">
          <span className="mb-1 block font-mono text-[10px] tracking-[0.12em] text-accent uppercase">
            TL;DR
          </span>
          <EventText provenance="claimed" text={payload.tldr} />
        </div>
      )}

      {payload?.meta && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          {payload.meta.map((m) => (
            <span key={m.label} className="flex items-center gap-1.5">
              {m.label} <ProvenanceBadge provenance={m.provenance} />
            </span>
          ))}
        </div>
      )}

      {decided ? (
        <p className="mt-4 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2.5 text-sm text-ok">
          decision logged · <b>{decided.decision.replace('_', ' ')}</b>
          {decided.comment ? ` · "${decided.comment}"` : ''} · agent acts next session
        </p>
      ) : blocked ? (
        <p className="mt-4 rounded-lg border border-risk/40 bg-risk/10 px-3 py-2.5 text-sm text-risk">
          auto-blocked after 3 rejections (F19) — this card is now a discussion thread; the task or
          spec is probably wrong, not the code. Talk it out before more rework.
        </p>
      ) : (
        <>
          <h3 className="mt-4 mb-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
            Verify in 60 seconds — every step checked or skipped-with-reason to approve
          </h3>
          {steps.map((s, i) => (
            <div key={s.text} className="mb-2 rounded-lg border border-line bg-bg px-3 py-2.5">
              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={s.checked}
                  onChange={(e) =>
                    setSteps(
                      steps.map((x, j) => (j === i ? { ...x, checked: e.target.checked } : x)),
                    )
                  }
                  className="mt-0.5 h-4 w-4 accent-(--color-accent)"
                />
                <span className={s.checked ? 'text-muted line-through' : ''}>{s.text}</span>
                {!s.checked && (
                  <button
                    className="ml-auto font-mono text-[10px] text-muted underline"
                    onClick={() =>
                      setSteps(steps.map((x, j) => (j === i ? { ...x, skipping: !x.skipping } : x)))
                    }
                  >
                    skip…
                  </button>
                )}
              </label>
              {s.skipping && !s.checked && (
                <input
                  value={s.skippedReason}
                  onChange={(e) =>
                    setSteps(
                      steps.map((x, j) => (j === i ? { ...x, skippedReason: e.target.value } : x)),
                    )
                  }
                  placeholder="why is it safe to skip this step?"
                  className="mt-2 w-full rounded border border-line bg-surface2 px-2 py-1 text-xs"
                />
              )}
            </div>
          ))}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="comment — required to reject or request changes, optional on approve"
            className="mt-2 w-full rounded border border-line bg-surface2 px-2.5 py-2 text-xs"
            rows={2}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              disabled={!complete || busy}
              onClick={() => decide('approve')}
              className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-35"
            >
              Approve gate
            </button>
            <button
              disabled={comment.trim() === '' || busy}
              onClick={() => decide('reject')}
              className="rounded-lg border border-line bg-surface2 px-4 py-2 text-[13px] disabled:opacity-35"
            >
              Reject with comment
            </button>
            <button
              disabled={comment.trim() === '' || busy}
              onClick={() => decide('request_changes')}
              className="rounded-lg border border-line bg-surface2 px-4 py-2 text-[13px] disabled:opacity-35"
            >
              Request changes
            </button>
            <span className="text-xs text-muted">
              {complete
                ? 'All steps handled — your call, coach.'
                : 'Complete the steps to unlock approval.'}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

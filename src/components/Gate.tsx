// The signature Gate card: only what a decision needs up front — title, TL;DR,
// meta, checklist, actions. Full report + tape sit behind one expander (DEC-28).
import { useState } from 'react';
import type { CourtsideState } from '../contract/state.generated';
import { postDecision, type DecisionPost, type GateView } from '../lib/api';
import { EventText, ProvenanceBadge } from './Provenance';
import { stepsComplete, VerifySteps, type StepState } from './VerifySteps';

export function GateCard({
  view,
  state,
  token,
  onDecisionError,
  onOpenDoc,
}: {
  view: GateView;
  state: CourtsideState;
  token: string;
  onDecisionError: (msg: string) => void;
  onOpenDoc?: (ref: string) => void;
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

  const complete = stepsComplete(steps);
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
    // success needs no local state (inbox write → watcher → ws push), but a
    // stale failure banner must not outlive a decision that landed
    onDecisionError(res.ok ? '' : res.error);
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
        {payload?.sourceRef &&
          (onOpenDoc ? (
            <button
              onClick={() => onOpenDoc(payload.sourceRef!)}
              className="font-mono text-[11px] text-info underline"
            >
              {payload.sourceRef}
            </button>
          ) : (
            <span className="font-mono text-[11px] text-muted">{payload.sourceRef}</span>
          ))}
        {rejections > 0 && (
          <span className="rounded bg-risk/15 px-1.5 py-px font-mono text-[10px] text-risk">
            {rejections}× rejected
          </span>
        )}
      </div>

      {view.payloadMissing && (
        <p
          title="the gate names a report file Courtside cannot read — unverifiable evidence"
          className="mt-3 rounded border border-dashed border-risk/50 bg-risk/5 px-3 py-2.5 font-mono text-[11px] text-risk"
        >
          report {view.payloadNote ?? 'missing'} — {gate.payloadRef}
        </p>
      )}

      {payload?.tldr && (
        <div className="mt-3 rounded-r-md border-l-[3px] border-accent bg-surface2 px-3.5 py-2.5 text-[13.5px]">
          <EventText provenance="claimed" text={payload.tldr} />
        </div>
      )}

      {payload?.meta && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          {payload.meta.map((m) => (
            <span key={m.label} className="flex items-center gap-1.5">
              {m.artifactRef ? (
                <a
                  href={`/api/artifact/${m.artifactRef}?token=${token}`}
                  target="_blank"
                  rel="noreferrer"
                  title={`evidence: ${m.artifactRef}`}
                  className="underline"
                >
                  {m.label}
                </a>
              ) : (
                m.label
              )}{' '}
              <ProvenanceBadge provenance={m.provenance} />
            </span>
          ))}
        </div>
      )}

      {decided ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2.5 text-sm ${
            decided.decision === 'approve'
              ? 'border-ok/40 bg-ok/10 text-ok'
              : 'border-line bg-surface2 text-text'
          }`}
        >
          {decided.decision.replace('_', ' ')} · logged — agent acts next session
          {decided.comment ? ` · "${decided.comment}"` : ''}
        </p>
      ) : blocked ? (
        <p className="mt-4 rounded-lg border border-risk/40 bg-risk/10 px-3 py-2.5 text-sm text-risk">
          blocked after 3 rejections — discuss before more rework
        </p>
      ) : (
        <>
          <VerifySteps steps={steps} onChange={setSteps} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="comment (required to reject)"
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
              Reject
            </button>
            <button
              disabled={comment.trim() === '' || busy}
              onClick={() => decide('request_changes')}
              className="rounded-lg border border-line bg-surface2 px-4 py-2 text-[13px] disabled:opacity-35"
            >
              Request changes
            </button>
          </div>
        </>
      )}

      {(payload?.reportMd || (view.tape && view.tape.length > 0)) && (
        <details className="mt-4">
          <summary className="cursor-pointer font-mono text-[11px] text-muted">
            {[
              payload?.reportMd ? 'report' : null,
              view.tape?.length
                ? `tape (${view.tape.filter((f) => f.exists).length}${
                    view.tape.some((f) => !f.exists)
                      ? `, ${view.tape.filter((f) => !f.exists).length} missing`
                      : ''
                  })`
                : null,
            ]
              .filter(Boolean)
              .join(' + ')}{' '}
            ▸
          </summary>
          {payload?.reportMd && (
            <pre className="mt-2 rounded border border-line bg-bg p-3 font-body text-xs whitespace-pre-wrap text-muted">
              {payload.reportMd}
            </pre>
          )}
          {view.tape && view.tape.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {view.tape.map((f) =>
                f.exists && f.url ? (
                  <figure key={f.ref} className="w-40">
                    <a
                      href={`${f.url}?token=${token}`}
                      target="_blank"
                      rel="noreferrer"
                      title="open full size"
                    >
                      <img
                        src={`${f.url}?token=${token}`}
                        alt={f.ref}
                        className="rounded border border-line hover:border-accent"
                      />
                    </a>
                    <figcaption className="mt-0.5 flex items-center gap-1 font-mono text-[9.5px] text-muted">
                      {f.ref.split('/').at(-1)} <ProvenanceBadge provenance="verified" />
                    </figcaption>
                  </figure>
                ) : (
                  <figure
                    key={f.ref}
                    title="file not found — unverifiable evidence"
                    className="flex h-[90px] w-40 flex-col items-center justify-center rounded border border-dashed border-risk/50 bg-risk/5 text-center"
                  >
                    <span className="font-mono text-[10px] text-risk">missing</span>
                    <span className="mt-1 font-mono text-[9.5px] text-muted">
                      {f.ref.split('/').at(-1)}
                    </span>
                  </figure>
                ),
              )}
            </div>
          )}
        </details>
      )}
    </section>
  );
}

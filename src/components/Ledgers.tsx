// F5 ledgers: questions / debt / decisions with age indicators + state freshness
// (R1). Read-only — answering questions is F9 (M2). Tones from derive helpers.
import type { CourtsideState } from '../contract/state.generated';
import { ageBucket, freshness, type Tone } from '../lib/derive';
import { formatAgo } from '../lib/format';
import { SendToAgent, type DispatchApi } from './SendToAgent';

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  muted: 'text-muted',
  risk: 'text-risk',
};

function Row({
  label,
  count,
  note,
  tone,
  children,
}: {
  label: string;
  count: number | null;
  note: string;
  tone: Tone;
  children?: React.ReactNode;
}) {
  const head = (
    <div className="flex w-full items-center justify-between py-2 text-[13px]">
      <span>
        {label}{' '}
        {count !== null && (
          <span className="ml-1 rounded-full border border-line bg-surface2 px-2 font-mono text-[11px]">
            {count}
          </span>
        )}
      </span>
      <span className={`font-mono text-[10.5px] ${TONE_TEXT[tone]}`}>{note}</span>
    </div>
  );
  // an empty list must not render as a clickable expander that opens onto nothing
  if (!children || count === 0)
    return <div className="border-b border-line last:border-b-0">{head}</div>;
  return (
    <details className="border-b border-line last:border-b-0">
      <summary className="cursor-pointer list-none">{head}</summary>
      <div className="pb-2.5 text-xs">{children}</div>
    </details>
  );
}

export function Ledgers({
  state,
  dispatch,
  repoUrl,
}: {
  state: CourtsideState;
  dispatch?: DispatchApi;
  repoUrl?: string;
}) {
  const questions = state.questions ?? [];
  const debt = state.debt ?? [];
  const decisions = state.decisions ?? [];
  const open = questions.filter((q) => q.status === 'open');
  const oldestOpen = [...open].sort((a, b) => a.openedAt.localeCompare(b.openedAt))[0];
  const newestDebt = [...debt].sort((a, b) => b.incurredAt.localeCompare(a.incurredAt))[0];
  const lastDecision = [...decisions].sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0];
  const fresh = freshness(state.generatedAt);

  return (
    <section className="mt-5 rounded-card border border-line bg-surface px-5 py-2.5">
      <h2 className="mt-2 mb-0 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        Notes &amp; Decisions
      </h2>
      <p className="mb-1 text-[11px] text-muted">
        questions the AI is tracking · choices made · last update
      </p>
      <Row
        label="Open questions"
        count={open.length}
        note={
          oldestOpen
            ? `oldest ${formatAgo(oldestOpen.openedAt)}${
                ageBucket(oldestOpen.openedAt) === 'risk' ? ' — itching' : ''
              }`
            : '—'
        }
        tone={oldestOpen ? ageBucket(oldestOpen.openedAt) : 'muted'}
      >
        {open.map((q) => (
          <div key={q.id} className="mb-2 rounded border border-line bg-bg p-2.5">
            <p>
              <span className="font-mono text-[11px] text-muted">{q.id}</span> {q.text}
            </p>
            {q.options && (
              <ul className="mt-1 list-disc pl-5 text-muted">
                {q.options.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            )}
            {q.recommendation && <p className="mt-1 text-accent">rec: {q.recommendation}</p>}
            <p className="mt-1 font-mono text-[10.5px] text-muted">
              opened {formatAgo(q.openedAt)}
              {q.blocking?.length ? ` · needed for ${q.blocking.join(', ')}` : ''}
            </p>
            {dispatch && (
              <p className="mt-2">
                <SendToAgent
                  state={dispatch.stateOf('question', q.id)}
                  run={dispatch.runOf('question', q.id)}
                  options={q.options}
                  requireAnswer
                  onSend={(answer, context) => dispatch.send('question', q.id, answer, context)}
                />
              </p>
            )}
          </div>
        ))}
      </Row>
      <Row
        label="Things to fix later"
        count={debt.length}
        note={newestDebt ? `newest ${formatAgo(newestDebt.incurredAt)}` : '—'}
        tone="muted"
      >
        {debt.map((d) => (
          <p key={d.id} className="mb-1.5">
            <span className="font-mono text-[11px] text-muted">{d.id}</span> {d.text}
            {d.taskId && <span className="font-mono text-[10.5px] text-muted"> · {d.taskId}</span>}
          </p>
        ))}
      </Row>
      <Row
        label="Recent decisions"
        count={decisions.length}
        note={lastDecision ? `last ${formatAgo(lastDecision.decidedAt)}` : '—'}
        tone="muted"
      >
        {decisions.map((d) => (
          <p key={d.id} className="mb-1.5">
            <span className="font-mono text-[11px] text-muted">{d.id}</span> {d.text}
            <span className="font-mono text-[10.5px] text-muted">
              {' '}
              · by {d.by}
              {d.gateId ? ` · ${d.gateId}` : ''}
              {d.commit && (
                <>
                  {' · '}
                  {repoUrl ? (
                    <a
                      href={`${repoUrl}/commit/${d.commit}`}
                      target="_blank"
                      rel="noreferrer"
                      title="open the commit"
                      className="underline"
                    >
                      {d.commit}
                    </a>
                  ) : (
                    d.commit
                  )}
                </>
              )}
            </span>
          </p>
        ))}
      </Row>
      <Row
        label="Last updated"
        count={null}
        note={
          state.generatedAt
            ? `${fresh === 'risk' ? 'stale — ' : ''}generated ${formatAgo(state.generatedAt)}`
            : 'no generatedAt'
        }
        tone={fresh}
      />
    </section>
  );
}

// F2 backlog view: grouped by slice, status chips, prominent visual
// criterion, expandable full card, dependency arrow strip (depsDepth).
import { useState } from 'react';
import type { CourtsideState } from '../contract/state.generated';
import { depsDepth } from '../lib/derive';
import { SendToAgent, type DispatchApi } from './SendToAgent';

type Task = CourtsideState['tasks'][number];
const DISPATCHABLE = new Set<Task['status']>(['todo', 'revise', 'blocked']);

const STATUS_TONE: Record<Task['status'], string> = {
  done: 'bg-ok/15 text-ok',
  'in-review': 'bg-accent/15 text-accent',
  revise: 'bg-risk/15 text-risk',
  blocked: 'bg-risk/15 text-risk',
  'in-progress': 'bg-info/15 text-info',
  todo: 'bg-surface2 text-muted',
};

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`rounded px-1.5 py-px font-mono text-[10px] whitespace-nowrap ${tone}`}>
      {children}
    </span>
  );
}

function TaskRow({
  task,
  dispatch,
  onOpenDoc,
  repoUrl,
}: {
  task: Task;
  dispatch?: DispatchApi;
  onOpenDoc?: (ref: string) => void;
  repoUrl?: string;
}) {
  const dispatchable = dispatch && DISPATCHABLE.has(task.status);
  return (
    <details className="group mb-2 rounded-lg border border-line bg-bg">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2.5 px-3 py-2.5">
        <span className="font-mono text-[11px] text-muted">{task.id}</span>
        <span className="min-w-0 flex-1 text-sm">{task.title}</span>
        {task.rejections ? (
          <Chip tone="bg-risk/15 text-risk">{task.rejections}× rejected</Chip>
        ) : null}
        <span title="todo → in-progress → in-review (your call) → done; revise/blocked after rejection">
          <Chip tone={STATUS_TONE[task.status]}>{task.status}</Chip>
        </span>
      </summary>
      <div className="border-t border-line px-3 py-2.5 text-xs">
        <p className="text-muted">
          {task.logicOnly ? (
            <Chip tone="border border-line bg-surface2 text-muted">
              {`Not visible yet${task.surfacesAt ? ` — shows up at ${task.surfacesAt}` : ''}`}
            </Chip>
          ) : (
            <>
              <span className="font-mono text-[10px] uppercase">visual: </span>
              {task.visualCriterion ?? '—'}
            </>
          )}
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-muted">
          {onOpenDoc ? (
            <button onClick={() => onOpenDoc(task.sourceRef)} className="underline">
              {task.sourceRef}
            </button>
          ) : (
            task.sourceRef
          )}
          {task.deps?.length ? ` · deps ${task.deps.join(', ')}` : ''}
          {task.commit && (
            <>
              {' · commit '}
              {repoUrl ? (
                <a
                  href={`${repoUrl}/commit/${task.commit}`}
                  target="_blank"
                  rel="noreferrer"
                  title="open the commit"
                  className="underline"
                >
                  {task.commit}
                </a>
              ) : (
                task.commit
              )}
            </>
          )}
        </p>
        {dispatchable && (
          <p className="mt-2">
            <SendToAgent
              state={dispatch.stateOf('task', task.id)}
              run={dispatch.runOf('task', task.id)}
              onSend={(answer, context) => dispatch.send('task', task.id, answer, context)}
            />
          </p>
        )}
      </div>
    </details>
  );
}

export function Backlog({
  tasks,
  dispatch,
  onOpenDoc,
  repoUrl,
}: {
  tasks: CourtsideState['tasks'];
  dispatch?: DispatchApi;
  onOpenDoc?: (ref: string) => void;
  repoUrl?: string;
}) {
  const [open, setOpen] = useState(true);
  const slices = [...new Set(tasks.map((t) => t.slice ?? 'unsliced'))];
  return (
    <section className="mt-5 rounded-card border border-line bg-surface p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-baseline justify-between"
      >
        <h2 className="mb-0 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          The Plan
        </h2>
        <span className="font-mono text-[11px] text-muted">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <p className="mb-3 mt-0.5 text-[11px] text-muted">
          what&apos;s been built and what&apos;s coming next
        </p>
      )}
      {open &&
        slices.map((slice) => {
          const sliceTasks = tasks.filter((t) => (t.slice ?? 'unsliced') === slice);
          const depth = depsDepth(sliceTasks);
          const ordered = [...sliceTasks].sort(
            (a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0),
          );
          // finished work folds to one line — the board leads with what's live
          const active = ordered.filter((t) => t.status !== 'done');
          const done = ordered.filter((t) => t.status === 'done');
          return (
            <div key={slice} className="mb-4 last:mb-0">
              <p className="mb-2 font-mono text-[11px] text-muted">
                {slice} · {ordered.map((t) => t.id).join(' → ')}
              </p>
              {active.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  dispatch={dispatch}
                  onOpenDoc={onOpenDoc}
                  repoUrl={repoUrl}
                />
              ))}
              {done.length > 0 && (
                <details className="mb-2">
                  <summary className="cursor-pointer rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[11px] text-ok">
                    ✓ {done.length} done ▸
                  </summary>
                  <div className="mt-2">
                    {done.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        dispatch={dispatch}
                        onOpenDoc={onOpenDoc}
                        repoUrl={repoUrl}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
    </section>
  );
}

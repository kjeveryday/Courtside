// F2 backlog view: grouped by slice, status chips, risk badges, prominent visual
// criterion, expandable full card, dependency arrow strip (depsDepth).
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

const RISK_TONE: Record<NonNullable<Task['risk']>, string> = {
  low: 'bg-ok/15 text-ok',
  med: 'bg-accent/15 text-accent',
  high: 'bg-risk/15 text-risk',
};

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`rounded px-1.5 py-px font-mono text-[10px] whitespace-nowrap ${tone}`}>
      {children}
    </span>
  );
}

function TaskRow({ task, dispatch }: { task: Task; dispatch?: DispatchApi }) {
  const dispatchable = dispatch && DISPATCHABLE.has(task.status);
  return (
    <details className="group mb-2 rounded-lg border border-line bg-bg">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2.5 px-3 py-2.5">
        <span className="font-mono text-[11px] text-muted">{task.id}</span>
        <span className="min-w-0 flex-1 text-sm">{task.title}</span>
        {task.rejections ? (
          <Chip tone="bg-risk/15 text-risk">{task.rejections}× rejected</Chip>
        ) : null}
        {task.risk && <Chip tone={RISK_TONE[task.risk]}>risk: {task.risk}</Chip>}
        <Chip tone={STATUS_TONE[task.status]}>{task.status}</Chip>
      </summary>
      <div className="border-t border-line px-3 py-2.5 text-xs">
        <p className="text-muted">
          {task.logicOnly ? (
            <Chip tone="border border-line bg-surface2 text-muted">
              LOGIC-ONLY → surfaces at {task.surfacesAt ?? '?'}
            </Chip>
          ) : (
            <>
              <span className="font-mono text-[10px] uppercase">visual: </span>
              {task.visualCriterion ?? '—'}
            </>
          )}
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-muted">
          source {task.sourceRef}
          {task.deps?.length ? ` · deps ${task.deps.join(', ')}` : ''}
          {task.commit ? ` · commit ${task.commit}` : ''}
        </p>
        {dispatchable && (
          <p className="mt-2">
            <SendToAgent
              state={dispatch.stateOf('task', task.id)}
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
}: {
  tasks: CourtsideState['tasks'];
  dispatch?: DispatchApi;
}) {
  const slices = [...new Set(tasks.map((t) => t.slice ?? 'unsliced'))];
  return (
    <section className="mt-5 rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        Backlog
      </h2>
      {slices.map((slice) => {
        const sliceTasks = tasks.filter((t) => (t.slice ?? 'unsliced') === slice);
        const depth = depsDepth(sliceTasks);
        const ordered = [...sliceTasks].sort(
          (a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0),
        );
        return (
          <div key={slice} className="mb-4 last:mb-0">
            <p className="mb-2 font-mono text-[11px] text-muted">
              {slice} · {ordered.map((t) => t.id).join(' → ')}
            </p>
            {ordered.map((t) => (
              <TaskRow key={t.id} task={t} dispatch={dispatch} />
            ))}
          </div>
        );
      })}
    </section>
  );
}

// Dispatch validation (DEC-29): maps a button click into a structured directive,
// or refuses. Instructions are derived from the object — the only freeform human
// text travels in the clearly-labeled answer/context fields (answers-as-data).
import type { CourtsideState } from '../contract/state.generated.ts';
import type { DirectiveInput } from '../core/decisions.ts';

export type DirectiveRuling =
  | { directive: Omit<DirectiveInput, 'planDir' | 'runtimeDir'> }
  | { status: 400 | 404 | 409; error: string };

export function buildDirective(
  state: CourtsideState,
  body: { kind?: string; id?: string; answer?: string; context?: string },
): DirectiveRuling {
  const context = body.context?.trim() || undefined;

  if (body.kind === 'task') {
    const task = state.tasks.find((t) => t.id === body.id);
    if (!task) return { status: 404, error: `no such task: ${body.id ?? '(missing id)'}` };
    if (!['todo', 'revise', 'blocked'].includes(task.status))
      return { status: 409, error: `${task.id} is ${task.status} — nothing to dispatch` };
    return {
      directive: {
        kind: 'task',
        id: task.id,
        instruction: `Work ${task.id} — ${task.title}. Follow the framework: tests first, wire it into the harness, post a gate when done.`,
        context,
      },
    };
  }

  if (body.kind === 'question') {
    const q = (state.questions ?? []).find((x) => x.id === body.id);
    if (!q) return { status: 404, error: `no such question: ${body.id ?? '(missing id)'}` };
    if (q.status !== 'open') return { status: 409, error: `${q.id} is already answered` };
    const answer = body.answer?.trim();
    if (!answer) return { status: 400, error: 'an answer is required' };
    return {
      directive: {
        kind: 'question',
        id: q.id,
        instruction: `${q.id} is answered: act on it, unblock ${q.blocking?.join(', ') || 'dependent work'}, and mark it answered in state.json.`,
        answer,
        context,
      },
    };
  }

  return { status: 400, error: 'kind must be task | question' };
}

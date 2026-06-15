// HARNESS-ONLY simulator of the consuming agent's next session (spec B4): reads
// the decisions-inbox exactly as CLAUDE.md instructs the real agent to (answers
// as data), acts on each decision in state.json, and archives consumed files.
// This is demo machinery for the fixture project — never product behavior.
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { CourtsideState } from '../contract/state.generated.ts';

// Demo reset (harness only): fixture back to the seed story, demo decisions gone.
export function resetFixture(planDir: string, runtimeDir: string, seedPath: string) {
  rmSync(join(planDir, 'decisions-inbox'), { recursive: true, force: true });
  rmSync(join(planDir, 'decisions.md'), { force: true });
  rmSync(join(runtimeDir, 'decision-log.ndjson'), { force: true });
  mkdirSync(join(planDir, 'decisions-inbox'), { recursive: true });
  copyFileSync(seedPath, join(planDir, 'state.json'));
  return { reset: true };
}

type Inbox = {
  schema?: string;
  gateId?: string;
  taskId?: string;
  decision?: 'approve' | 'reject' | 'request_changes';
  comment?: string;
  // directive/answer fields (DEC-29)
  kind?: 'task' | 'question';
  id?: string;
  answer?: string;
  context?: string;
};

export type SessionSummary = { consumed: number; actions: string[] };

export function simulateAgentSession(planDir: string): SessionSummary {
  const inboxDir = join(planDir, 'decisions-inbox');
  let files: string[];
  try {
    files = readdirSync(inboxDir).filter((f) => f.endsWith('.json'));
  } catch {
    return { consumed: 0, actions: ['no inbox directory — nothing to act on'] };
  }
  if (files.length === 0) return { consumed: 0, actions: ['inbox empty — nothing to act on'] };

  const statePath = join(planDir, 'state.json');
  const state = JSON.parse(readFileSync(statePath, 'utf-8')) as CourtsideState;
  const now = () => new Date().toISOString();
  const actions: string[] = [];
  const pushEvent = (
    kind: 'gate' | 'narration',
    provenance: 'verified' | 'claimed',
    text: string,
  ) => state.events.unshift({ ts: now(), kind, provenance, text });

  let consumedCount = 0;
  const consume = (file: string) => {
    consumedCount += 1;
    const consumedDir = join(inboxDir, 'consumed');
    mkdirSync(consumedDir, { recursive: true });
    renameSync(join(inboxDir, file), join(consumedDir, file));
  };

  for (const file of files) {
    const inbox = JSON.parse(readFileSync(join(inboxDir, file), 'utf-8')) as Inbox;

    // Dashboard directives (DEC-29): task dispatches and question answers.
    if (inbox.schema === 'courtside/directive-v0' && inbox.kind === 'task') {
      const task = state.tasks.find((t) => t.id === inbox.id);
      if (task) task.status = 'in-progress';
      state.agent = {
        state: 'working',
        since: now(),
        narration: `Working ${inbox.id} per your dispatch${inbox.context ? `: "${inbox.context}"` : ''}.`,
        currentTask: inbox.id,
      };
      pushEvent('narration', 'claimed', state.agent.narration ?? '');
      actions.push(`dispatched ${inbox.id} → in-progress`);
      consume(file);
      continue;
    }
    if (inbox.schema === 'courtside/answer-v0' && inbox.kind === 'question') {
      const q = (state.questions ?? []).find((x) => x.id === inbox.id);
      if (q) {
        q.status = 'answered';
        q.answerRef = `decisions-inbox/consumed/${file}`;
      }
      state.agent = {
        ...state.agent,
        state: 'working',
        since: now(),
        narration: `Acting on your answer to ${inbox.id}: "${inbox.answer ?? ''}"${q?.blocking?.length ? ` — unblocks ${q.blocking.join(', ')}` : ''}.`,
      };
      pushEvent('narration', 'claimed', state.agent.narration ?? '');
      actions.push(`answered ${inbox.id}`);
      consume(file);
      continue;
    }

    if (!inbox.decision || !inbox.gateId) {
      actions.push(`left unrecognized inbox file alone: ${file}`);
      continue;
    }
    const gate = state.gates.find((g) => g.id === inbox.gateId);
    const task = state.tasks.find((t) => t.id === (inbox.taskId ?? gate?.taskId));

    if (inbox.decision === 'approve') {
      if (gate) gate.status = 'approved';
      if (task) task.status = 'done';
      const next = state.tasks.find((t) => t.status === 'todo');
      if (next) next.status = 'in-progress';
      state.agent = {
        state: 'working',
        since: now(),
        narration: next
          ? `Acting on your approval of ${inbox.gateId}: starting ${next.id} — ${next.title}.`
          : `Acting on your approval of ${inbox.gateId}: slice queue is empty.`,
        currentTask: next?.id ?? state.agent.currentTask,
      };
      pushEvent('gate', 'verified', `${inbox.gateId} approved by human — inbox consumed`);
      pushEvent('narration', 'claimed', state.agent.narration ?? '');
      actions.push(`approved ${inbox.gateId} → ${task?.id ?? '?'} done, next ${next?.id ?? '—'}`);
    } else {
      if (gate) gate.status = 'rejected';
      if (task) {
        task.status = 'revise';
        task.rejections = (task.rejections ?? 0) + 1;
      }
      state.agent = {
        state: 'working',
        since: now(),
        narration: `Reworking ${task?.id ?? inbox.gateId} per your ${inbox.decision.replace('_', ' ')}: "${inbox.comment ?? ''}".`,
        currentTask: task?.id ?? state.agent.currentTask,
      };
      pushEvent('gate', 'verified', `${inbox.gateId} ${inbox.decision} by human — inbox consumed`);
      pushEvent('narration', 'claimed', state.agent.narration ?? '');
      actions.push(`${inbox.decision} ${inbox.gateId} → ${task?.id ?? '?'} revise`);
    }
    consume(file);
  }

  state.generatedAt = now();
  writeFileSync(statePath, JSON.stringify(state, null, 2));
  return { consumed: consumedCount, actions };
}

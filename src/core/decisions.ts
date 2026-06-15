// One human decision = three coordinated writes (PRD §5 async loop, F6):
//   1. append-only chained log (.courtside/decision-log.ndjson) — the audit truth
//   2. plan/decisions-inbox/<gateId>.json — structured answers-as-data for the
//      agent's next session (carries its chain mac)
//   3. a human-readable line in plan/decisions.md
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { loadOrCreateSecret, signEntry, type ChainEntry, type DecisionBody } from './signing.ts';

const LOG_FILE = 'decision-log.ndjson';

export function readDecisionLog(runtimeDir: string): ChainEntry[] {
  const path = join(runtimeDir, LOG_FILE);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ChainEntry);
}

export type DecisionInput = {
  planDir: string;
  runtimeDir: string;
  gateId: string;
  taskId?: string;
  decision: DecisionBody['decision'];
  comment: string;
  steps: DecisionBody['steps'];
};

export function appendDecision(input: DecisionInput): ChainEntry {
  const secret = loadOrCreateSecret(input.runtimeDir);
  const log = readDecisionLog(input.runtimeDir);
  const prevMac = log.at(-1)?.mac ?? '';
  const body: DecisionBody = {
    seq: log.length + 1,
    ts: new Date().toISOString(),
    gateId: input.gateId,
    taskId: input.taskId,
    decision: input.decision,
    comment: input.comment,
    steps: input.steps,
  };
  const entry: ChainEntry = { ...body, prevMac, mac: signEntry(secret, body, prevMac) };

  appendFileSync(join(input.runtimeDir, LOG_FILE), JSON.stringify(entry) + '\n');

  const inboxDir = join(input.planDir, 'decisions-inbox');
  mkdirSync(inboxDir, { recursive: true });
  writeFileSync(
    join(inboxDir, `${input.gateId}.json`),
    JSON.stringify(
      {
        schema: 'courtside/decision-v0',
        gateId: entry.gateId,
        taskId: entry.taskId,
        decision: entry.decision,
        comment: entry.comment,
        steps: entry.steps,
        decidedAt: entry.ts,
        by: 'human',
        seq: entry.seq,
        mac: entry.mac,
      },
      null,
      2,
    ),
  );

  const line = `- ${entry.ts} · ${entry.gateId} · **${entry.decision}** · by human${
    entry.comment ? ` · "${entry.comment}"` : ''
  } · mac:${entry.mac.slice(0, 8)}\n`;
  appendFileSync(join(input.planDir, 'decisions.md'), line);

  return entry;
}

export function decisionFor(planDir: string, gateId: string): unknown | undefined {
  const path = join(planDir, 'decisions-inbox', `${gateId}.json`);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Dashboard → agent directives (DEC-29): a task dispatch or question answer,
// signed into the same chain and inbox the agent already reads first.
export type DirectiveInput = {
  planDir: string;
  runtimeDir: string;
  kind: 'task' | 'question';
  id: string;
  instruction: string; // derived from the object, not freeform
  answer?: string; // chosen option or written answer (questions)
  context?: string; // the human's optional added context
};

export function appendDirective(input: DirectiveInput): ChainEntry {
  const secret = loadOrCreateSecret(input.runtimeDir);
  const log = readDecisionLog(input.runtimeDir);
  const prevMac = log.at(-1)?.mac ?? '';
  const body: DecisionBody = {
    seq: log.length + 1,
    ts: new Date().toISOString(),
    gateId: input.id,
    taskId: input.kind === 'task' ? input.id : undefined,
    decision: input.kind === 'task' ? 'dispatch' : 'answer',
    comment: [input.answer, input.context].filter(Boolean).join(' · '),
    steps: [],
  };
  const entry: ChainEntry = { ...body, prevMac, mac: signEntry(secret, body, prevMac) };
  appendFileSync(join(input.runtimeDir, LOG_FILE), JSON.stringify(entry) + '\n');

  const inboxDir = join(input.planDir, 'decisions-inbox');
  mkdirSync(inboxDir, { recursive: true });
  writeFileSync(
    join(inboxDir, `${input.kind === 'task' ? 'directive' : 'answer'}-${input.id}.json`),
    JSON.stringify(
      {
        schema: input.kind === 'task' ? 'courtside/directive-v0' : 'courtside/answer-v0',
        kind: input.kind,
        id: input.id,
        instruction: input.instruction,
        answer: input.answer,
        context: input.context,
        decidedAt: entry.ts,
        by: 'human',
        seq: entry.seq,
        mac: entry.mac,
      },
      null,
      2,
    ),
  );
  appendFileSync(
    join(input.planDir, 'decisions.md'),
    `- ${entry.ts} · ${input.id} · **${body.decision}**${input.answer ? ` · "${input.answer}"` : ''}${
      input.context ? ` · context: "${input.context}"` : ''
    } · mac:${entry.mac.slice(0, 8)}\n`,
  );
  return entry;
}

export type PendingDispatch = {
  kind: 'task' | 'question';
  id: string;
  answer?: string;
  context?: string;
  decidedAt: string;
};

export function pendingDispatches(planDir: string): PendingDispatch[] {
  const inboxDir = join(planDir, 'decisions-inbox');
  if (!existsSync(inboxDir)) return [];
  return readdirSync(inboxDir)
    .filter((f) => f.startsWith('directive-') || f.startsWith('answer-'))
    .map((f) => JSON.parse(readFileSync(join(inboxDir, f), 'utf-8')) as PendingDispatch & object);
}

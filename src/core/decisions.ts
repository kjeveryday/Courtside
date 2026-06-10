// One human decision = three coordinated writes (PRD §5 async loop, F6):
//   1. append-only chained log (.courtside/decision-log.ndjson) — the audit truth
//   2. plan/decisions-inbox/<gateId>.json — structured answers-as-data for the
//      agent's next session (carries its chain mac)
//   3. a human-readable line in plan/decisions.md
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

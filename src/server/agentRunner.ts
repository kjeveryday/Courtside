// Real agent activation (DEC-29): spawns the configured agent command with a
// prompt built from structured directive fields. Config-gated — when no command
// is configured, dispatches only queue in the inbox (the agent's next session
// picks them up). Output is captured to a log file (openable evidence).
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db.ts';

export type AgentRun = {
  id: string;
  kind: string;
  startedAt: string;
  status: 'running' | 'exited' | 'failed';
  exitCode?: number;
  logFile: string;
};

const runs = new Map<string, AgentRun>();

// Finished runs persist in the runtime db (D-3): a server restart must not
// silently downgrade a failed launch back to "in agent inbox". Only finished
// runs are stored — a stale "running" from a dead server would be a lie.
const KV_KEY = 'agent_runs';

export function persistRun(db: Db, run: AgentRun) {
  if (run.status === 'running') return;
  const rest = persistedRuns(db).filter((r) => !(r.kind === run.kind && r.id === run.id));
  db.setKv(KV_KEY, JSON.stringify([...rest, run].slice(-20)));
}

export function persistedRuns(db: Db): AgentRun[] {
  try {
    return JSON.parse(db.getKv(KV_KEY) ?? '[]') as AgentRun[];
  } catch {
    return [];
  }
}

// All runs visible to the dashboard: live ones first, then finished runs
// remembered from earlier boots (memory wins per target).
export function allRuns(db?: Db): AgentRun[] {
  const mem = [...runs.values()];
  if (!db) return mem;
  const seen = new Set(mem.map((r) => `${r.kind}:${r.id}`));
  return [...mem, ...persistedRuns(db).filter((r) => !seen.has(`${r.kind}:${r.id}`))];
}

export function dispatchAgent(opts: {
  agentCmd: string; // e.g. "claude" — first token is the binary, rest are args
  cwd: string;
  runtimeDir: string;
  kind: string;
  id: string;
  instruction: string;
  context?: string;
  onExit?: (run: AgentRun) => void;
}): AgentRun {
  const [bin, ...baseArgs] = opts.agentCmd.split(/\s+/) as [string, ...string[]];
  const prompt =
    `Courtside dispatch — ${opts.kind} ${opts.id}. ${opts.instruction}` +
    (opts.context ? ` Human context: ${opts.context}` : '') +
    ' Read plan/decisions-inbox/ first, per CLAUDE.md.';

  const logDir = join(opts.runtimeDir, 'runs');
  mkdirSync(logDir, { recursive: true });
  const logFile = join(logDir, `${Date.now()}-${opts.id}.log`);
  const run: AgentRun = {
    id: opts.id,
    kind: opts.kind,
    startedAt: new Date().toISOString(),
    status: 'running',
    logFile,
  };
  runs.set(opts.id, run);

  const child = spawn(bin, [...baseArgs, '-p', prompt], { cwd: opts.cwd, shell: false });
  const log = createWriteStream(logFile);
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  child.on('error', () => {
    run.status = 'failed';
    opts.onExit?.(run);
  });
  child.on('exit', (code) => {
    run.status = code === 0 ? 'exited' : 'failed';
    run.exitCode = code ?? undefined;
    opts.onExit?.(run);
  });
  return run;
}

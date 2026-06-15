// Ask Courtside, layer 2 (TASK-30): the live Q&A endpoint. It always returns
// deterministic bearings (board + project docs + the Courtside guide); with an
// agent command connected it also writes a prose answer grounded in exactly
// that context. The question and files never leave the machine — the only
// thing launched is the user's own local agent command (DEC-29 posture).
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { CourtsideState } from '../contract/state.generated.ts';
import { gatherBearings, scoreText, terms, type Bearing } from '../core/bearings.ts';
import { decisionFor, pendingDispatches } from '../core/decisions.ts';
import { runDoctor } from '../core/doctor.ts';
import { allRuns } from './agentRunner.ts';

type Doc = { name: string; text: string };
type AskCtx = { planDir: string; repoRoot: string; runtimeDir: string; agentCmd?: string };

const MAX_DOC_BYTES = 400_000;
const MAX_DOCS = 50;

// Project markdown (root, docs/, plan/**) + the Courtside guide — the guide
// answers tool questions in EVERY watched project, not just this repo.
export function collectDocs(planDir: string, courtsideRoot: string): Doc[] {
  const projectRoot = dirname(planDir);
  const docs: Doc[] = [];
  const seen = new Set<string>();
  const push = (abs: string, name: string) => {
    if (docs.length >= MAX_DOCS || seen.has(name) || !existsSync(abs)) return;
    const st = statSync(abs);
    if (!st.isFile() || st.size > MAX_DOC_BYTES) return;
    seen.add(name);
    docs.push({ name, text: readFileSync(abs, 'utf-8') });
  };
  const pushDir = (absDir: string, relDir: string, recurse: boolean) => {
    if (!existsSync(absDir)) return;
    for (const entry of readdirSync(absDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory() && recurse) pushDir(join(absDir, entry.name), rel, true);
      else if (entry.isFile() && entry.name.endsWith('.md')) push(join(absDir, entry.name), rel);
    }
  };
  if (projectRoot !== courtsideRoot)
    push(join(courtsideRoot, 'docs', 'courtside-guide.md'), 'courtside-guide.md');
  pushDir(projectRoot, '', false);
  pushDir(join(projectRoot, 'docs'), 'docs', false);
  pushDir(planDir, 'plan', true);
  return docs;
}

// Live, ephemeral facts the state file alone can't tell: decided-but-pending
// gates, inbox directives, agent runs, doctor complaints.
export function liveFacts(
  ctx: AskCtx,
  state: CourtsideState | undefined,
  question: string,
): Bearing[] {
  const qTerms = terms(question);
  const facts: Bearing[] = [];
  const add = (source: string, text: string) =>
    facts.push({ source, text, score: 2 + scoreText(qTerms, text) });
  for (const g of state?.gates ?? []) {
    if (g.status !== 'pending') continue;
    const d = decisionFor(ctx.planDir, g.id) as { decision?: string } | undefined;
    add(
      `board · ${g.id}`,
      d?.decision
        ? `gate ${g.id} is decided (${d.decision}) and sits in the agent inbox — the agent acts on it next session`
        : `gate ${g.id} is waiting on the human`,
    );
  }
  for (const p of pendingDispatches(ctx.planDir))
    add(
      `inbox · ${p.id}`,
      `${p.kind} ${p.id} is in the agent inbox${'context' in p && p.context ? ` with context "${p.context}"` : ''}`,
    );
  for (const r of allRuns())
    add(
      `agent · ${r.id}`,
      `agent run on ${r.kind} ${r.id}: ${r.status}${r.exitCode !== undefined ? ` (exit ${r.exitCode})` : ''}`,
    );
  for (const f of runDoctor({
    repoRoot: ctx.repoRoot,
    planDir: ctx.planDir,
    runtimeDir: ctx.runtimeDir,
    agentCmd: ctx.agentCmd,
  }))
    if (f.status === 'fail' || f.status === 'warn')
      add(`doctor · ${f.id}`, `${f.status}: ${f.detail}${f.fixit ? ` — fix: ${f.fixit}` : ''}`);
  return facts;
}

export function boardSnapshot(state: CourtsideState | undefined): string {
  if (!state) return 'state.json is currently INVALID — the board is showing the refusal screen.';
  const by = (s: string) =>
    state.tasks
      .filter((t) => t.status === s)
      .map((t) => t.id)
      .join(', ');
  return [
    `phase ${state.phase ?? '?'} · slice ${state.slice ?? '?'} · agent ${state.agent.state}${state.agent.currentTask ? ` on ${state.agent.currentTask}` : ''}`,
    `agent says (claimed): "${state.agent.narration ?? ''}"`,
    `tasks ${state.tasks.length}: in-review [${by('in-review')}] · in-progress [${by('in-progress')}] · todo [${by('todo')}] · revise [${by('revise')}] · blocked [${by('blocked')}] · done ${state.tasks.filter((t) => t.status === 'done').length}`,
    `gates: ${state.gates.map((g) => `${g.id}:${g.status}`).join(' · ') || 'none'}`,
    `open questions: ${
      (state.questions ?? [])
        .filter((q) => q.status === 'open')
        .map((q) => q.id)
        .join(', ') || 'none'
    } · debt: ${(state.debt ?? []).map((d) => d.id).join(', ') || 'none'}`,
  ].join('\n');
}

export function buildAskPrompt(opts: {
  question: string;
  transcript: { q: string; a: string }[];
  snapshot: string;
  bearings: readonly Bearing[];
}): string {
  return [
    'You are Ask Courtside, the live Q&A inside the Courtside dashboard (the human supervises a coding agent through this board). Answer plainly and briefly — a short paragraph, no markdown headers. Ground every statement ONLY in the context below; if the context does not contain the answer, say so instead of guessing.',
    '== Board ==',
    opts.snapshot,
    '== Matched sources ==',
    ...opts.bearings.map((b) => `[${b.source}] ${b.text}`),
    ...(opts.transcript.length
      ? [
          '== Earlier in this conversation ==',
          ...opts.transcript.flatMap((t) => [`Q: ${t.q}`, `A: ${t.a}`]),
        ]
      : []),
    '== Question ==',
    opts.question,
  ].join('\n');
}

// One-shot local spawn, stdout captured. Same config gate as dispatch: no
// agent command, no spawn, no spend.
export function askAgent(opts: {
  agentCmd: string;
  cwd: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<{ ok: true; answer: string } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const [bin, ...baseArgs] = opts.agentCmd.split(/\s+/) as [string, ...string[]];
    const child = spawn(bin, [...baseArgs, '-p', opts.prompt], { cwd: opts.cwd, shell: false });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: 'agent timed out (120 s)' });
    }, opts.timeoutMs ?? 120_000);
    child.stdout.on('data', (d: Buffer) => {
      out += d.toString();
      if (out.length > 64_000) child.kill();
    });
    child.stderr.on('data', (d: Buffer) => (err = (err + d.toString()).slice(0, 500)));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ ok: false, error: e.message });
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) resolve({ ok: true, answer: out.trim().slice(0, 64_000) });
      else resolve({ ok: false, error: `agent exit ${code ?? '?'}${err ? ` — ${err}` : ''}` });
    });
  });
}

export async function handleAsk(
  ctx: AskCtx,
  body: { question?: unknown; transcript?: unknown },
  state: CourtsideState | undefined,
): Promise<{ status: number; payload: unknown }> {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return { status: 400, payload: { error: 'ask needs a question' } };
  if (question.length > 2_000) return { status: 400, payload: { error: 'question too long' } };
  const transcript = (Array.isArray(body.transcript) ? body.transcript : [])
    .filter(
      (t): t is { q: string; a: string } => typeof t?.q === 'string' && typeof t?.a === 'string',
    )
    .slice(-4);

  const bearings = gatherBearings({
    state,
    extra: liveFacts(ctx, state, question),
    docs: collectDocs(ctx.planDir, ctx.repoRoot),
    question,
  });
  if (!ctx.agentCmd) return { status: 200, payload: { bearings, agentConfigured: false } };

  const r = await askAgent({
    agentCmd: ctx.agentCmd,
    cwd: dirname(ctx.planDir),
    prompt: buildAskPrompt({ question, transcript, snapshot: boardSnapshot(state), bearings }),
  });
  return {
    status: 200,
    payload: {
      bearings,
      agentConfigured: true,
      ...(r.ok ? { answer: r.answer } : { answerError: r.error }),
    },
  };
}

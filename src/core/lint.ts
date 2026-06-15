// `courtside lint` (PRD §10): schema validity + the referential integrity the
// JSON Schema can't express (inventory §5.7) + decision-log chain verification.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readState } from '../server/state.ts';
import { readDecisionLog } from './decisions.ts';
import { loadOrCreateSecret, verifyChain } from './signing.ts';

export type Finding = { level: 'pass' | 'warn' | 'fail'; text: string };

export function lintPlan(planDir: string, runtimeDir: string): Finding[] {
  const findings: Finding[] = [];
  const result = readState(planDir);
  if (!result.ok) {
    return result.errors.map((e) => ({ level: 'fail' as const, text: `state.json — ${e}` }));
  }
  findings.push({ level: 'pass', text: 'state.json validates against courtside/v0' });

  const state = result.state;
  const taskIds = new Set(state.tasks.map((t) => t.id));
  // Paths in state.json are repo-root-relative ("plan/…", PRD §10); we hold the
  // plan dir, so normalize before existence checks.
  const relToPlan = (p: string) => (p.startsWith('plan/') ? p.slice('plan/'.length) : p);
  const ref = (owner: string, id: string | undefined, kind: string, level: 'fail' | 'warn') => {
    if (id && !taskIds.has(id))
      findings.push({ level, text: `${owner} references missing ${kind} ${id}` });
  };

  for (const t of state.tasks) {
    // warn, not fail: a dep may have aged out of the (windowed) task list
    for (const d of t.deps ?? []) ref(t.id, d, 'dep', 'warn');
    if (t.logicOnly && !t.surfacesAt)
      findings.push({ level: 'fail', text: `${t.id} is logicOnly without surfacesAt` });
    if (!t.logicOnly && !t.visualCriterion)
      findings.push({ level: 'warn', text: `${t.id} has no visual criterion` });
    if (t.surfacesAt && !taskIds.has(t.surfacesAt))
      findings.push({
        level: 'warn',
        text: `${t.id} surfaces at ${t.surfacesAt}, which is not in the task list yet`,
      });
  }
  for (const q of state.questions ?? [])
    for (const b of q.blocking ?? []) ref(q.id, b, 'blocked task', 'fail');
  ref('agent.currentTask', state.agent.currentTask, 'task', 'fail');

  for (const g of state.gates) {
    ref(g.id, g.taskId, 'task', 'fail');
    if (g.payloadRef && !existsSync(join(planDir, relToPlan(g.payloadRef))))
      findings.push({ level: 'fail', text: `${g.id} payloadRef missing: ${g.payloadRef}` });
    for (const frame of g.tape ?? []) {
      if (!existsSync(join(planDir, relToPlan(frame))))
        findings.push({ level: 'warn', text: `${g.id} tape frame missing: ${frame}` });
    }
  }

  const log = readDecisionLog(runtimeDir);
  if (log.length === 0) {
    findings.push({ level: 'pass', text: 'decision log empty (nothing to verify yet)' });
  } else {
    const chain = verifyChain(loadOrCreateSecret(runtimeDir), log);
    findings.push(
      chain.ok
        ? { level: 'pass', text: `decision log chain verifies (${log.length} entries)` }
        : { level: 'fail', text: `decision log chain BROKEN at seq ${chain.brokenAt}` },
    );
  }
  return findings;
}

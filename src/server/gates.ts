// Gate views (state gates joined with payload files + inbox decisions) and the
// server-enforced decision rules (F6/F7/F19 live here, not only in the UI).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CourtsideState } from '../contract/state.generated.ts';
import { appendDecision, decisionFor } from '../core/decisions.ts';

type StateGate = CourtsideState['gates'][number];

export type GateView = {
  gate: StateGate;
  payload?: unknown;
  payloadMissing?: boolean;
  decided?: unknown;
};

const relToPlan = (p: string) => (p.startsWith('plan/') ? p.slice('plan/'.length) : p);

export function gateViews(planDir: string, state: CourtsideState | undefined): GateView[] {
  if (!state) return [];
  return state.gates.map((gate) => {
    const view: GateView = { gate };
    if (gate.payloadRef) {
      const path = join(planDir, relToPlan(gate.payloadRef));
      if (existsSync(path)) view.payload = JSON.parse(readFileSync(path, 'utf-8'));
      else view.payloadMissing = true;
    }
    view.decided = decisionFor(planDir, gate.id);
    return view;
  });
}

export type DecisionRequest = {
  gateId?: string;
  decision?: string;
  comment?: string;
  steps?: { text?: string; checked?: boolean; skippedReason?: string }[];
};

export type DecisionRuling =
  | { status: 200; seq: number }
  | { status: 400 | 404 | 409; error: string };

export function decideGate(
  planDir: string,
  runtimeDir: string,
  state: CourtsideState | undefined,
  req: DecisionRequest,
): DecisionRuling {
  const gate = state?.gates.find((g) => g.id === req.gateId);
  if (!gate) return { status: 404, error: `no such gate: ${req.gateId ?? '(missing id)'}` };
  if (decisionFor(planDir, gate.id))
    return { status: 409, error: `${gate.id} already has a decision in the inbox` };

  const decision = req.decision;
  if (decision !== 'approve' && decision !== 'reject' && decision !== 'request_changes')
    return { status: 400, error: 'decision must be approve | reject | request_changes' };

  const comment = (req.comment ?? '').trim();
  if ((decision === 'reject' || decision === 'request_changes') && comment === '')
    return { status: 400, error: `${decision} requires a comment (F19)` };

  const steps = req.steps ?? [];
  if (decision === 'approve') {
    const required = gate.verifySteps?.length ?? 0;
    const complete =
      steps.length === required &&
      steps.every((s) => s.checked === true || (s.skippedReason ?? '').trim() !== '');
    if (!complete)
      return {
        status: 400,
        error: `approve requires all ${required} verify steps checked or skipped-with-reason (F7)`,
      };
  }

  const entry = appendDecision({
    planDir,
    runtimeDir,
    gateId: gate.id,
    taskId: gate.taskId,
    decision,
    comment,
    steps: steps.map((s) => ({
      text: s.text ?? '',
      checked: s.checked,
      skippedReason: s.skippedReason,
    })),
  });
  return { status: 200, seq: entry.seq };
}

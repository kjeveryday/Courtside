/* GENERATED — do not edit. Source of truth: spec/state.schema.json.
 * Regenerate with `npm run codegen`; `npm run check` fails on drift (rule 13). */

export type TaskId = string;
export type Sha = string;

/**
 * Machine-readable mirror of /plan state. Markdown remains canonical for humans. Derive mechanically (git, hooks) where possible; agent-written where necessary. Every event carries provenance.
 */
export interface CourtsideState {
  schema: 'courtside/v0';
  /**
   * Framework phase, e.g. '0', '1.5', '5'
   */
  phase: string;
  slice?: string;
  generatedAt?: string;
  agent: {
    state: 'working' | 'parked_at_gate' | 'blocked' | 'idle';
    since: string;
    narration?: string;
    currentTask?: TaskId;
  };
  gates: {
    id: string;
    type: 'scope' | 'slicing' | 'harness' | 'spec' | 'tasks' | 'sequence' | 'task_review';
    status: 'pending' | 'approved' | 'rejected' | 'superseded';
    postedAt: string;
    taskId?: TaskId;
    /**
     * Path to /plan/gates/<id>.json
     */
    payloadRef?: string;
    commit?: Sha;
    /**
     * Paths under /plan/tape/
     */
    tape?: string[];
    verifySteps?: {
      text: string;
      /**
       * Acceptance criterion this step proves; audited by F11 anti-gaming check
       */
      criterionRef?: string;
    }[];
    /**
     * Path to /plan/decisions-inbox/<id>.json once decided
     */
    decisionRef?: string;
  }[];
  tasks: {
    id: TaskId;
    title: string;
    status: 'todo' | 'in-progress' | 'in-review' | 'revise' | 'blocked' | 'done';
    risk?: 'low' | 'med' | 'high';
    deps?: TaskId[];
    slice?: string;
    /**
     * Required unless logicOnly is true
     */
    visualCriterion?: string;
    logicOnly?: boolean;
    /**
     * Required when logicOnly; the visual checkpoint task
     */
    surfacesAt?: string;
    /**
     * doc#section the task derives from; no source = scope creep
     */
    sourceRef: string;
    /**
     * 3 auto-blocks the task (F19)
     */
    rejections?: number;
    commit?: Sha;
  }[];
  questions?: {
    id: string;
    text: string;
    /**
     * @minItems 2
     * @maxItems 4
     */
    options?: [string, string] | [string, string, string] | [string, string, string, string];
    recommendation?: string;
    blocking?: TaskId[];
    openedAt: string;
    status: 'open' | 'answered';
    answerRef?: string;
  }[];
  debt?: {
    id: string;
    text: string;
    incurredAt: string;
    taskId?: TaskId;
  }[];
  decisions?: {
    id: string;
    text: string;
    decidedAt: string;
    by: 'human' | 'agent';
    gateId?: string;
    commit?: Sha;
  }[];
  events: {
    ts: string;
    kind: 'narration' | 'test_run' | 'lint' | 'audit' | 'gate' | 'capture' | 'push';
    /**
     * verified = Courtside executed/parsed it (doctor, lint, hook output, git). claimed = agent-authored prose. UI must render these distinctly (F18).
     */
    provenance: 'verified' | 'claimed';
    text: string;
    /**
     * Raw output file backing a verified event
     */
    artifactRef?: string;
  }[];
}

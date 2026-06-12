// Pure display helpers (vitest-first, rule 17). Ages compute from the real clock
// (DEC-6) — fixture drift reads as growing ages, which is correct behavior.
import type { CourtsideState } from '../contract/state.generated';

type AgentState = CourtsideState['agent']['state'];
type CourtsideEvent = CourtsideState['events'][number];
type EventKind = CourtsideEvent['kind'];

export function formatAgo(iso: string, nowMs: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  return `${Math.floor(diffSec / 86400)} d ago`;
}

export function humanizeAgentState(state: AgentState): string {
  return state.replace(/_/g, ' ');
}

// Exhaustive by type: adding a kind to the schema breaks this Record at compile
// time — the new kind must pick a color before the app builds (rule 13 spirit).
const KIND_COLORS: Record<EventKind, string> = {
  narration: 'bg-info',
  test_run: 'bg-ok',
  lint: 'bg-ok',
  audit: 'bg-muted',
  gate: 'bg-accent',
  capture: 'bg-muted',
  push: 'bg-muted',
};

export function kindColor(kind: EventKind): string {
  return KIND_COLORS[kind];
}

// Server-observed event kinds (ticker merge, TASK-28) — outside the schema enum
// on purpose: these come from the Courtside db, not from state.json.
const SERVER_KIND_COLORS: Record<string, string> = {
  validation_failed: 'bg-risk',
  dispatch: 'bg-accent',
  ask: 'bg-accent',
  agent_run: 'bg-info',
  agent_session_sim: 'bg-muted',
};

export function serverKindColor(kind: string): string {
  return SERVER_KIND_COLORS[kind] ?? 'bg-muted';
}

export function latestEventOfKind(
  events: readonly CourtsideEvent[],
  kind: EventKind,
): CourtsideEvent | undefined {
  return events
    .filter((e) => e.kind === kind)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .at(-1);
}

export function localTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

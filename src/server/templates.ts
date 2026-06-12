// Setup wizard templates (TASK-31): the starter files a fresh project gets.
// Pure builders — setup.ts decides what to write, these decide what's in it.
import type { CourtsideState } from '../contract/state.generated.ts';

export function freshState(projectName: string, writtenNote: string): CourtsideState {
  const now = new Date().toISOString();
  return {
    schema: 'courtside/v0',
    phase: '0',
    generatedAt: now,
    agent: {
      state: 'idle',
      since: now,
      narration:
        'Set up complete. Kick off your agent with: "Read CLAUDE.md, begin Phase 0, and expand gdd.md with the human first."',
    },
    gates: [],
    tasks: [],
    questions: [],
    debt: [],
    decisions: [],
    events: [
      {
        ts: now,
        kind: 'audit',
        provenance: 'verified',
        text: `project "${projectName}" set up by the wizard — ${writtenNote}`,
      },
    ],
  };
}

export function gddFromDescription(projectName: string, description: string): string {
  return `# ${projectName} — design doc (starter)

> Written by Courtside setup from your description. Your agent's first job
> (Phase 0) is to expand this WITH you before anything gets built.

## The game in your words

${description.trim()}

## Pillars

TODO — the 2–3 feelings/promises everything else serves.

## Core loop

TODO — what the player does, minute to minute.

## Scope guardrails

TODO — what v0.1 deliberately leaves out.
`;
}

export function claudeMdStarter(projectName: string): string {
  return `# CLAUDE.md — Always-On Rules (${projectName})

Project: ${projectName}, supervised through the Courtside dashboard. The human
reads logic but does not write code — optimize for their ability to SEE and
VERIFY everything in the browser and the game harness.

## Process

1. Follow docs/framework-v2.md. Stop at every GATE — decisions arrive through
   the dashboard; never auto-advance past one.
2. FIRST ACTION every session: read plan/decisions-inbox/ and act on what the
   human decided (answers-as-data). Archive consumed files to consumed/.
3. The design doc (gdd.md) wins on features and behavior. Spec silent? Log the
   question in plan/open-questions.md with options + a recommendation. Stop.
4. Narrate: before each step, one line on WHY and WHAT'S NEXT into
   plan/state.json events (provenance "claimed").
5. Plan state lives in plan/ (state.json, backlog.md, decisions.md,
   tech-debt.md, session-log.md) — never only in chat.

## Harness

6. Every task ends in something observable in the game, or is declared
   LOGIC-ONLY with a named task where it surfaces. Max 2–3 logic-only in a row.

## Honesty

7. state.json events carry provenance: "verified" ONLY for real tool output
   (tests, lint, git); your own prose is always "claimed". The dashboard
   renders the difference — never dress a claim as a fact.

## Git & security

8. Commit per completed task; message starts with the TASK-ID. Never commit
   past an undecided gate.
9. Local-first: no telemetry, no outbound calls beyond what the human
   configures. Decision files are signed — never edit them.
`;
}

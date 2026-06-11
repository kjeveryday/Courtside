# GATE 5 · G5-TASK-23 — awaiting Kyle's pass (DEC-29)

## TASK-23 — done (2026-06-10) · activate the agent from the dashboard

**TL;DR:** Tasks and open questions now carry a **send to agent ▸** control with an
optional context field. Clicking writes a signed directive into the same inbox the
agent reads first thing each session; the item shows "in agent inbox ▸ next
session" (or "agent running…" when a real launch is configured). Questions take an
answer — click one of its options or write your own — plus context. The demo's
"agent's next session ▸" consumes dispatches exactly like a real session; in a
real project, setting `COURTSIDE_AGENT_CMD=claude` makes the button launch Claude
Code immediately, output captured to `.courtside/runs/` (off by default so a click
never silently spends usage).

**Verify:** demo → expand TASK-13 in the backlog → send to agent with context →
chip appears → "agent's next session ▸" → scorebug flips to _working on TASK-13_
with your context quoted in the narration; same for Q-7 via Ledgers → Open
questions (option buttons + send) → Q-7 leaves the open list.

**Evidence:** T31 (validation: 409 on done tasks, 400 answerless questions, 404
unknown), T32 (mixed decisions+directives chain verifies; simulator consumes both
kinds), T33 (real spawn with a stub command — prompt, context, and inbox
instruction captured in the run log) — 57/57. Live smoke in session: dispatch +
answer → queued chips → session → `TASK-13 in-progress / Q-7 answered`, context
echoed.

**Security note (kept honest):** instructions are derived from the object;
human-typed answer/context travel in labeled fields; directives are chain-signed;
spawn is explicit per-click, config-gated, never shell-interpolated.

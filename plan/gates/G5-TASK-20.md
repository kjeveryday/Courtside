# GATE 5 · G5-TASK-20 — ✅ auto-approved (autonomous mode, DEC-20) — S7 SHIPPED

## TASK-20 — done (2026-06-10)

**TL;DR:** "The Huddle" answers a cold return in seconds: a header button renders
the Tier-1 deterministic briefing — tasks shipped, gates waiting (and how long),
questions itching (and what they block), agent state — every line computed
server-side from state + decision log + SQLite last-seen, every line ✓ verified.
prev_seen rotates only after a 30-min gap so reloads don't wipe the diff (DEC-26).
**Verify:** token URL → "The Huddle ▸" in header → panel with the briefing; after
approving + simulating the agent session, reopen → it reflects the new reality.
**Evidence:** T29 (gate/question/agent facts, shipped counting, caught-up case) —
52/52; live smoke: briefing matched the PRD §F20 example shape word-for-word
("1 task shipped (TASK-11) · 1 gate waiting on you — G5-TASK-12 · Q-7 still open …
blocking TASK-15 · agent parked at gate").
**Deviations:** none. **Debt:** none. **S7 criterion met.**
**Next:** TASK-21 — ship-check vs PRD §12 criteria + final report. Final task.

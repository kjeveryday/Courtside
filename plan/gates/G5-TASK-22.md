# GATE 5 · G5-TASK-22 — awaiting Kyle's visual pass (quality mandate, DEC-28)

## TASK-22 — done (2026-06-10) · copy diet & dedupe

**TL;DR:** The dashboard says about half as much. Biggest cut: the Agent card under
the gate (a near-total duplicate of the scorebug) is gone. Provenance badges are
now glyphs (✓/◇) with hover labels instead of words on every line. All
spec-citation and explainer prose is out of the UI. The gate card holds only what
a decision needs — report + tape live behind one expander. Scorebug labels are
AGENT/NARRATION/TASK/TESTS with tightened sub-lines. The footer is a DEMO strip:
"agent's next session ▸" and a working "reset ↺" button — no terminal commands in
UI copy anywhere.

**Verify:** `npm run dev` → token URL: page is visibly quieter; gate card shows
`Verify · 0/4` counting up; "report + tape ▸" expands; approve → cycle → click
**reset ↺** → page returns to the pending-gate story live.

**Evidence:** 53/53 (T30 covers reset); programmatic smoke in session: cycle →
`working on TASK-13 / approved`, reset → `parked_at_gate / pending / decided:
none`. StatusCard.tsx deleted (was pure duplication).

**Per Kyle's six:** (1) source label dropped, ref kept as a chip — link-out queued
for when a docs route exists; (2) instructional heading → counter; (3) gate card
decluttered via expander; (4) scorebug shrunk + dedup; (5) "simulate" wording gone,
DEMO strip labeled honestly (Courtside never executes the agent — security
boundary); (6) reset is a button.

# GATE 5 · G5-TASK-18 — ✅ auto-approved (autonomous mode, DEC-20) — S6 SHIPPED

## TASK-18 — done (2026-06-10)

**TL;DR:** The header now carries the doctor. A green dot reads "doctor: all
green"; clicking it opens the Pre-game warmup panel — every check with its fix-it
line, deferred items honestly marked _skip_ (MCP → M2, engine plugins → interface
only, GitHub auth → v0.2). Checks re-run on every live state push, so a
mid-session breakage flips the badge without a reload.
**Verify:** token URL → green dot in header → click → panel; break the fixture's
state.json → badge flips red on the next push + refusal view; fix → green.
**Evidence:** 47/47; live API smoke: 11 checks · 0 fail · 0 warn.
**Deviations:** none. **Debt:** none. **S6 criterion met (terminal + UI surfaces).**
**Next:** S7 tape viewer + huddle.

# GATE 5 · G5-TASK-17 — ✅ auto-approved (autonomous mode, DEC-20)

## TASK-17 — done (2026-06-10)

**TL;DR:** `npx courtside` works in this repo: `doctor` prints categorized checks
with fix-it lines (environment / agent / project / engine / security) and exits 1
on failures; `lint` runs the contract+chain checks; `dev` boots the harness. The
deferred capabilities show as honest skips: MCP (M2), engine plugins (interface
shipped, none configured), GitHub auth/push (F16, v0.2).

**Verify:** `npx courtside doctor` → categorized table ending "doctor: all green ·
N warnings", exit 0. `npx courtside lint` → findings incl. the fixture's known
warnings (TASK-10 aged-out dep, TASK-16 surfacesAt, tape frame-002), exit 0.
**Evidence:** T26 (zero fails on this repo + fixture; skips asserted visible),
T27 (node floor boundaries) — 47/47 green; live CLI run in session, exit 0.
**Deviations:** none. **Debt:** none. **Next:** TASK-18 badge + preflight panel.

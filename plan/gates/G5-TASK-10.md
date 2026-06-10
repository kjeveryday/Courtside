# GATE 5 · G5-TASK-10 — ✅ auto-approved (autonomous mode, DEC-20)

## TASK-10 — done (2026-06-10) · LOGIC-ONLY → surfaces at TASK-11

**TL;DR:** Groundwork for the real server: the schema now also generates as a TS
const (one import semantics across node/vite/vitest, AD-7) and the shared validator
was proven to run under native-Node TypeScript (AD-2: `node` imported validate.ts
directly and validated — output in session log). Engines bumped to Node ≥24 (AD-1),
ws/@types installed (AD-3), and the harness fixture became a consuming-repo-shaped
project: `spec/fixtures/sample-project/plan/` with state.json generated from the
committed seed (zero drift), a real PNG tape frame (frame-002 deliberately missing
for the unverifiable-state demo), and a 14-test GUT artifact log backing the
fixture's verified test_run event.

**Verify:** `npm test` 15/15; `node scripts/scaffold-fixture.mjs` reports the
fixture path; `git status` shows no generated noise (gitignore covers state.json /
decisions-inbox / .courtside). **Evidence:** check green end-to-end; drift check
now pins BOTH generated artifacts (a prettier-vs-generator mismatch was caught
live by the drift check and fixed via ignore lists — the mechanism works).

**Deviations:** none vs spec B1. **Debt:** D-2 logged (fs.watch Linux recursive
gap). **Next:** TASK-11 server core.

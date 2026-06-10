# GATE 5 · G5-TASK-2 — ✅ approved 2026-06-10 (DEC-15)

Per-feature audit (framework §8) re-checked report claims against the diff before
posting: all trace to shown output (6/6 tests, drift exit codes); deviations
disclosed pre-approval; 0 findings. _(Agent-performed audit; the human approved on
test evidence per the logic-only declaration.)_

Posted 2026-06-10 · task: [TASK-2](../backlog.md) · commit `1fac2ed` ·
[diff on GitHub](https://github.com/kjeveryday/Courtside/commit/1fac2ed)

---

## TASK-2 — done, awaiting review

**TL;DR:** The data contract is now mechanical. TypeScript types are generated from
`spec/state.schema.json` (never hand-written — editing the generated file makes the
build fail), and a runtime validator turns any incoming data into either a fully
typed state object or a list of path-bearing errors. Six tests prove it, including
the shipped fixture validating end-to-end. **LOGIC-ONLY — you'll see it on screen at
TASK-3**, when the page renders the fixture through this exact pipeline.

**Verify in 60 seconds (terminal — this card was declared LOGIC-ONLY at GATE 3):**

1. `cd ~/Desktop/Courtside && npm test`
2. You should see: **Test Files 1 passed · Tests 6 passed (6)** — T1 fixture
   validates ✓, T2 missing key ✗, T3 bad enum ✗, T4 bad task-id pattern ✗,
   T5 unknown key ✗, T6 garbage input fails without crashing.
3. `npm run check` — first line of substance: **"codegen check OK: generated types
   match the schema."**, then green through format and tests.
4. (Optional, the rule-13 teeth) `echo "// x" >> src/contract/state.generated.ts`
   then `npm run codegen:check` → **"codegen check FAILED"**, exit code 1.
   Restore with `npm run codegen`.

**Why it was built this way:** rule 13 says the schema is law, so the only defense
that scales is mechanical: generated types + a drift check in `npm run check`
(exit 1 proven during the task, output shown in session). The validator takes
`unknown` and refuses partial acceptance (PRD §5 — invalid state must never render
as truth), with ajv error paths preserved so TASK-3's refusal state can name exactly
what's wrong.

**Test results (real output):** vitest `6 passed (6)` in 141ms · codegen drift check:
exit 1 on hand-edit, 0 after regen · `tsc --noEmit`, `eslint .`, `prettier --check .`
all clean · full `npm run check` green.

**Honest deviations:**

1. Tests import the fixture as a JSON module instead of reading via `node:fs`
   (spec §B5 said "read from disk"). Same shipped file, pinned at the same path —
   chosen to avoid adding `@types/node`, keeping the dependency surface at the
   GATE-1 list. Intent (test the real fixture) preserved.
2. `state.generated.ts` is excluded from ESLint/Prettier — its content is pinned
   byte-for-byte by the drift check instead; lint/format churn on generated code
   would be noise.
3. The codegen script overrides the schema's human title in memory so the generated
   root type is named `CourtsideState` (the schema file itself is untouched).

**What's next:** TASK-3 — fixture status page: fetch the fixture from the served
`spec/` directory, run it through `validateState`, render the green validated view
or the red refusal state. S1's visual checkpoint; completes the slice.

**Refactoring opportunities:** none — `validate.ts` is 24 lines; the contract module
is exactly the shape S2+ will consume.

**Tech debt incurred:** none. **Paid down:** D-1 retired (`passWithNoTests` removed
with the first real suite) → [tech-debt.md](../tech-debt.md).

**Open questions raised:** none.

---

**Decision (human, via chat):** approve / reject-with-comment. On approval TASK-2 →
`done` and TASK-3 (the slice's visual checkpoint) begins.

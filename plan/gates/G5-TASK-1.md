# GATE 5 · G5-TASK-1 — ✅ approved 2026-06-10 (DEC-14)

Human verified in browser after an environment fix (DEC-13: npm wasn't on his
terminal's PATH). Per-feature audit (framework §8) re-checked every report claim
against the diff: all claims trace to shown output; deviations were disclosed
pre-approval; 0 findings. _(Audit is agent-performed — the browser verify above is
the human-verified half.)_

Posted 2026-06-10 · task: [TASK-1](../backlog.md) · commit `cd8c233` ·
[diff on GitHub](https://github.com/kjeveryday/Courtside/commit/cd8c233)

---

## TASK-1 — done, awaiting review

**TL;DR:** The harness exists and stays on from here forward. `npm run dev` serves a
styled placeholder page at `127.0.0.1:4310` — fixed port, loopback only, loud failure
if the port is taken — and `npm run check` (typecheck + lint + format + tests) runs
green. Every future task ends with something you can see at this URL.

**Verify in 60 seconds:**

1. Terminal: `cd ~/Desktop/Courtside && npm run dev` — it prints a local URL on 4310.
2. Browser: open `http://localhost:4310`.
3. You should see: **"Courtside — harness alive"** — large bold heading with an
   **amber bar on its left edge**, and under it one small gray line:
   _"S1 walking-skeleton · TASK-1. Served from 127.0.0.1:4310 (strict). Fixture
   rendering lands at TASK-3."_ The styling (size/weight/amber/gray) proves Tailwind
   is live. Fonts are deliberately plain system fonts — the design language is S2.
4. (Optional, proves the loud-failure rule) Leave that terminal running, open a second
   terminal, run `npm run dev` again → it must **error out** mentioning port 4310 in
   use — never silently serve on a different port.
5. Stop the server with `Ctrl-C`.

**Why it was built this way:** Hand-rolled minimal scaffold instead of a generator
template so every file traces to spec §B1; host/port/strictPort pinned per CLAUDE.md
rules 10 and 15; `.prettierignore` shields the corpus (`docs/`, `spec/`, `CLAUDE.md`)
so tooling can never rewrite the law; README updated in the same task because stale
docs are a defect (rule 22).

**Test results (real output, re-run at posting time):**

```
$ npm run check
tsc --noEmit            → (no output = pass)
eslint .                → (no output = pass)
prettier --check .      → "All matched files use Prettier code style!"
vitest run              → "No test files found, exiting with code 0"
```

vitest passes on an intentionally empty suite via `passWithNoTests` — declared on the
TASK-1 card and logged as **[D-1](../tech-debt.md)**; TASK-2 lands the first real
suite and removes the flag. Browser rendering is **not** machine-verified — that is
exactly what this gate asks of you (rule 19: a passing check never substitutes for
the visual criterion).

**Honest deviations:**

1. `@types/react` / `@types/react-dom` installed — React 19 ships without types;
   these are the standard dev-only companions to the GATE-1-approved react packages,
   but they were not on the literal approved list. Flagged for your blessing.
2. The `codegen` script from spec §B1.3 arrives with TASK-2, per the approved card
   split (spec is satisfied at slice end, not per-task).
3. Prettier normalized the plan markdown (cosmetic only, separate commit `360d538`
   so this task's diff stays clean).

**What's next:** TASK-2 — contract pipeline: schema→types codegen with drift check
(rule 13 made mechanical), `validateState` via ajv, tests T1–T6. LOGIC-ONLY, surfaces
at TASK-3. Retires D-1.

**Refactoring opportunities:** none at this size.

**Tech debt incurred:** D-1 (above) → appended to [/plan/tech-debt.md](../tech-debt.md).

**Open questions raised:** none.

---

**Decision (to be filled by the human via chat):** approve / reject-with-comment.
On approval TASK-1 → `done` and TASK-2 begins; on rejection TASK-1 → `revise` with
your comment driving the rework.

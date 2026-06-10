# Backlog

Live task backlog (framework Phases 3–5). Cards follow the framework §4 schema; a
card without a visual criterion or an explicit LOGIC-ONLY declaration is invalid.
Milestone: **v0.1 "Courtside Lite"**. Slices S2–S7 get cards after their own Phase 2
specs — only the approved slice is decomposed (no speculative cards).

**Status legend:** todo → in-progress → in-review (gate posted) → done. `revise` /
`blocked` per F19 once the product tracks itself.

---

## Slice S1 — walking-skeleton (spec: [specs/walking-skeleton.md](specs/walking-skeleton.md))

Build order (Phase 4): **TASK-1 → TASK-2 → TASK-3** — a strict dependency chain;
no parallelism available or needed.

### [TASK-1] Scaffold the harness app

- Source: specs/walking-skeleton.md §B1; CLAUDE.md rules 8, 11–12, 15, 18; framework §2
- Slice / Milestone: S1 walking-skeleton / v0.1 Lite
- Description: Vite + React + TypeScript-strict + Tailwind scaffold with ESLint/
  Prettier/vitest and `npm run check`. The harness URL exists from this task onward
  and never breaks again.
- Acceptance criteria:
  - Given a fresh clone with Node ≥20, When `npm install && npm run dev`, Then
    `http://127.0.0.1:4310` serves a placeholder page ("Courtside — harness alive")
    with visible Tailwind styling (system fonts; tokens are S2).
  - Given port 4310 is already in use, When `npm run dev`, Then it exits with a clear
    error (strictPort) instead of drifting to another port.
  - Given the repo, When `npm run check`, Then typecheck + lint + format-check + tests
    pass. (vitest runs `passWithNoTests` until TASK-2 lands the first real suite —
    noted here so nobody mistakes it for a tested state.)
  - LICENSE (MIT) exists; package.json is `private`, `"license": "MIT"`,
    `engines.node >=20`; lockfile committed.
- VISUAL CRITERION: open `localhost:4310` → styled "Courtside — harness alive" page.
- Test approach: manual-in-harness + `npm run check`
- Dependencies: none
- Risk: low — boring, well-trodden scaffolding; only sharp edge is pinning
  host/port/strictPort correctly.
- Status: in-review (GATE 5 posted 2026-06-10)

### [TASK-2] Contract pipeline: codegen, validator, tests

- Source: specs/walking-skeleton.md §B2 §B3 §B5; CLAUDE.md rules 13, 17; PRD §10
- Slice / Milestone: S1 walking-skeleton / v0.1 Lite
- Description: generate `src/contract/state.generated.ts` from
  `spec/state.schema.json` (committed + drift-checked), implement `validateState`
  (ajv + ajv-formats, allErrors, path-bearing messages), land tests T1–T6.
- Acceptance criteria:
  - Given the schema, When `npm run codegen`, Then the generated file appears with a
    "GENERATED — do not edit" header and compiles under strict TS.
  - Given any hand-edit to the generated file, When `npm run check`, Then the drift
    check fails (rule 13 enforced mechanically).
  - Given the fixture read from disk, When validated, Then `ok: true` (T1).
  - Given each mutation — missing `agent`, `agent.state: "napping"`, task id `T-12`,
    unknown top-level key, non-object input — When validated, Then `ok: false` with
    errors naming the failing path, and no exception (T2–T6).
- VISUAL CRITERION: LOGIC-ONLY — surfaces at TASK-3 checkpoint (1 logic-only in a
  row; within the rule-9 budget of 2–3).
- Test approach: unit (vitest)
- Dependencies: [TASK-1]
- Risk: low — schema is plain draft-07; watch-item: json-schema-to-typescript output
  occasionally needs tsconfig accommodation, caught immediately by `npm run check`.
- Status: todo

### [TASK-3] Fixture status page with refusal state

- Source: specs/walking-skeleton.md §B4 §4; PRD §5 (no partial trust); DEC-4, DEC-6
- Slice / Milestone: S1 walking-skeleton / v0.1 Lite
- Description: fetch the fixture from the served `spec/` directory, validate via
  TASK-2, and render the status page — green validated view or red refusal state
  (errors listed, zero state data shown). S1's visual checkpoint.
- Acceptance criteria:
  - Given the valid fixture, When the page loads, Then it shows the green
    `fixture validates ✓ courtside/v0` line, chip `phase 5 · battle-core`, and agent
    block (`parked_at_gate`, since-time, italic narration, `TASK-12`) — all values
    from the fetched file, none hardcoded.
  - Given `agent.state` edited to `"napping"`, When the page reloads, Then the red
    refusal state appears naming `/agent/state`, and no fixture values render.
  - Given the fixture file missing or syntactically broken, When the page loads,
    Then the same refusal state appears with the underlying error message.
- VISUAL CRITERION: the two-state demo of spec §4 — green fixture-driven status page;
  break the fixture → red refusal naming the path; restore → green returns.
- Test approach: manual-in-harness (validation logic already unit-tested in TASK-2)
- Dependencies: [TASK-2]
- Risk: low
- Status: todo

---

## ⛩ GATE 3 — right tasks, right size? · ⛩ GATE 4 — approve build order + TASK-1?

Three cards, strict chain, one logic-only with a named checkpoint. On GATE 4
approval, Phase 5 begins with TASK-1 and stops at its GATE 5 browser review.

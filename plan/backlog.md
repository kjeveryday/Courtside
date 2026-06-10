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
- Status: done (GATE 5 approved 2026-06-10 · report: [gates/G5-TASK-1.md](gates/G5-TASK-1.md))

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
- Status: done (GATE 5 approved 2026-06-10 · report: [gates/G5-TASK-2.md](gates/G5-TASK-2.md))

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
- Status: done (GATE 5 approved 2026-06-10 · report: [gates/G5-TASK-3.md](gates/G5-TASK-3.md)) — **S1 complete**

---

## Slice S2 — scorebug (spec: [specs/scorebug.md](specs/scorebug.md))

Build order (Phase 4): **TASK-4 → TASK-5 → TASK-6** — strict chain (tokens before
components that use them; helpers/badges before the ticker that renders them).

### [TASK-4] Design language: tokens, vendored type, header

- Source: specs/scorebug.md §B1 §B2; mock `:root` tokens; CLAUDE.md rules 2, 15
- Slice / Milestone: S2 scorebug / v0.1 Lite
- Description: land the mock's tokens as Tailwind v4 `@theme` variables, vendor the
  three typefaces via @fontsource (GATE-2-approved), build the header (brand wordmark and mono phase chip from state), restyle the
  existing loading/refusal/status views onto tokens.
- Acceptance criteria:
  - Given `npm run dev`, When the page loads, Then the background is the mock's dark
    `#14171C`, the brand reads COURT**SIDE** in condensed display type with the
    accent on "side", and a mono chip shows `Phase 5 · battle-core` from the fixture.
  - Given the browser network panel, When the page loads, Then no font requests leave
    localhost (fonts are bundled files — rule 15).
  - Given any component file, Then no raw hex colors remain — token utilities only.
  - Given a broken fixture, Then the refusal state still renders, token-styled.
- VISUAL CRITERION: the page goes dark + branded; type is visibly Barlow Condensed /
  IBM Plex, not system fonts.
- Test approach: manual-in-harness + `npm run check`
- Dependencies: [TASK-3]
- Risk: med — Tailwind v4 `@theme` mapping and font-subset wiring have fiddly edges;
  all caught by `npm run check` + eyes.
- Status: in-progress

### [TASK-5] Scorebug strip + provenance badges + helpers

- Source: specs/scorebug.md §B3 §B5.1–2 §B6; PRD §5/F18/R6; CLAUDE.md rule 14
- Slice / Milestone: S2 scorebug / v0.1 Lite
- Description: pure helpers (`formatAgo`, `humanizeAgentState`, `kindColor`,
  `latestEventOfKind`) with tests T7–T10; `ProvenanceBadge` + `EventText` as the
  _only_ place claim/verified styling exists; the four-cell scorebug strip; status
  card restyle.
- Acceptance criteria:
  - Given the fixture, When the page loads, Then the strip shows: **parked at gate**
    in accent with pulsing dot ("since {time} · {ago}"), narration with the outlined
    ◇ agent-reported badge (+ TASK-12 title sub-line), active task `TASK-12 ·
in-review · med`, and the GUT test_run line with a solid ✓ verified badge.
  - Given `prefers-reduced-motion`, Then the pulse is static.
  - Given no `test_run` events / no narration / unknown currentTask, Then cells show
    their declared empty states ("no runs recorded" / "—") — T8 covers the selector.
  - Given `npm test`, Then T7–T10 pass (10 total with T1–T6).
  - Given a grep for verified-badge styling, Then it appears only in Provenance.tsx.
- VISUAL CRITERION: the scorebug strip live on the dark page, badges visibly
  distinct (solid ✓ vs outlined ◇).
- Test approach: unit (vitest T7–T10) + manual-in-harness
- Dependencies: [TASK-4]
- Risk: low
- Status: todo

### [TASK-6] Ticker + layout grid

- Source: specs/scorebug.md §B4 §B5.3; mock layout grammar
- Slice / Milestone: S2 scorebug / v0.1 Lite
- Description: side-column ticker (all events newest-first: mono time, kind-colored
  dot, text, provenance badge) and the mock's main/side grid (1.6fr/1fr, collapsing
  on narrow viewports); App slims to fetch shell + layout.
- Acceptance criteria:
  - Given the fixture, When the page loads, Then the ticker lists 4 events newest
    first; dots colored by kind (gate=accent, test_run=ok, narration=info); each
    line carries its provenance badge and a local HH:MM timestamp.
  - Given an events-empty (valid) state, Then the ticker shows the quiet
    "no events yet" line.
  - Given a viewport ≤860px, Then the grid collapses to one column (mock behavior).
- VISUAL CRITERION: full §4 slice criterion of the spec — dark branded page,
  scorebug, ticker with colored dots and badges; this is S2's finale.
- Test approach: manual-in-harness (helpers already unit-tested)
- Dependencies: [TASK-5]
- Risk: low
- Status: todo

---

## Gate history

- S1 GATES 3+4 approved 2026-06-10 (DEC-11/12); TASK-1..3 done, S1 shipped (DEC-16).
- S2 GATES 3+4: **pending** — right tasks/size? approve order + TASK-4?

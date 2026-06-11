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
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-4.md](gates/G5-TASK-4.md))

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
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-5.md](gates/G5-TASK-5.md))

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
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-6.md](gates/G5-TASK-6.md)) — **S2 complete**

---

## Gate history

- S1 GATES 3+4 approved 2026-06-10 (DEC-11/12); TASK-1..3 done, S1 shipped (DEC-16).
- S2 GATES 3+4 approved 2026-06-10 (DEC-18/19); TASK-4..6 done, S2 shipped (auto-approved per DEC-20).

---

## Slice S3 — mission-control (spec: [specs/mission-control.md](specs/mission-control.md)) · gates auto-approved (DEC-20)

Build order: **TASK-7 → TASK-8 → TASK-9**.

### [TASK-7] Backlog view with mini-graph

- Source: specs/mission-control.md §B1 §B5; PRD F2; F19 (counter visibility)
- Slice / Milestone: S3 mission-control / v0.1 Lite
- Description: task cards grouped by slice — status chips, risk badges, prominent
  visual criterion / LOGIC-ONLY chip, expandable full card (sourceRef, deps, commit,
  rejections), per-slice dependency arrow strip via tested `depsDepth`.
- Acceptance criteria: Given the fixture, Then 5 battle-core tasks render with
  correct chips (TASK-11 done/ok, TASK-12 in-review/accent, TASK-15 LOGIC-ONLY chip
  naming TASK-16); expanding TASK-12 shows `gdd.md#movement-ranges`, deps TASK-11,
  commit 3f8a21c, rejections 0; dep strip orders 11→12→13→14→15; T11 passes incl.
  unknown-dep and cycle-cap cases.
- VISUAL CRITERION: backlog card in main column, expand/collapse drilldown works.
- Test approach: unit (T11) + manual-in-harness
- Dependencies: [TASK-6] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-7.md](gates/G5-TASK-7.md))

### [TASK-8] Progress card (milestone bar + sparkline)

- Source: specs/mission-control.md §B2 §B5; PRD F3
- Description: side-column milestone card — accent done/total bar for the active
  slice, "N of M tasks", cumulative-decisions sparkline via tested `cumulativeByDay`.
- Acceptance criteria: Given the fixture, Then the bar fills 1/5 (20%) with
  "1 of 5 tasks"; sparkline renders one step (DEC-11 on 2026-06-10); T12 passes
  (ordering, multi-per-day, empty series).
- VISUAL CRITERION: milestone card tops the side column with a visible 20% bar.
- Test approach: unit (T12) + manual-in-harness
- Dependencies: [TASK-7] · Risk: low
- Status: done (auto-approved 2026-06-10 · reports: gates/G5-TASK-8.md, G5-TASK-9.md) — **S3 complete**

### [TASK-9] Ledgers + state freshness

- Source: specs/mission-control.md §B3 §B5; PRD F5, R1
- Description: ledgers card — questions/debt/decisions rows with age indicators
  (risk-red itch at ≥3d) and expandable lists (options + labeled recommendation
  shown read-only), plus the state-freshness row from `generatedAt`.
- Acceptance criteria: Given the fixture, Then questions row reads 1 open with
  oldest age in risk red (Q-7, opened 2026-06-04, blocking TASK-15 — expand shows 3
  options + recommendation); debt 1 (D-3); decisions 1 (DEC-11, by human, commit
  9d12e0a); freshness shows generatedAt ago with the spec's bucket color; T13/T14
  pass at the exact thresholds.
- VISUAL CRITERION: ledgers card under the ticker; expanding Open questions shows
  Q-7 verbatim with its recommendation.
- Test approach: unit (T13/T14) + manual-in-harness
- Dependencies: [TASK-8] · Risk: low
- Status: done (auto-approved 2026-06-10 · reports: gates/G5-TASK-8.md, G5-TASK-9.md) — **S3 complete**

---

## Slice S4 — live-wire (spec: [specs/live-wire.md](specs/live-wire.md)) · gates auto-approved (DEC-20)

Build order: **TASK-10 → TASK-11 → TASK-12**. Card details live in the spec's B1–B3
(behaviors written card-shaped there to avoid duplication; ACs = each B's bullets;
sources PRD §5/R7, AD-1..8).

### [TASK-10] Contract embed, engines bump, fixture project scaffold

- VISUAL CRITERION: LOGIC-ONLY — surfaces at TASK-11 (1 in a row).
- Test approach: existing suite + drift check across both generated artifacts
- Dependencies: [TASK-9] · Risk: med (engines/tsconfig churn hits everything; check catches)
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-10.md](gates/G5-TASK-10.md))

### [TASK-11] Server core: token auth, static serve, /api/state

- VISUAL CRITERION: token-URL boot; dashboard served by the Courtside server;
  tokenless visit → locked-out screen.
- Test approach: unit T15/T16 + integration T17 · Dependencies: [TASK-10] · Risk: med
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-11.md](gates/G5-TASK-11.md))

### [TASK-12] Watch → validate → WebSocket push + SQLite event log

- VISUAL CRITERION: edit fixture state.json → page updates live, no reload; broken
  JSON → live refusal; header live-dot.
- Test approach: unit T18/T19 + integration T20 · Dependencies: [TASK-11] · Risk: med
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-12.md](gates/G5-TASK-12.md)) — **S4 complete**

---

## Slice S5 — the-gate (spec: [specs/the-gate.md](specs/the-gate.md)) · gates auto-approved (DEC-20)

Build order: **TASK-13 → TASK-14 → TASK-15 → TASK-16**. ACs = the spec's B1–B4
bullets (card-shaped there; sources PRD F6/F7/F19, §5, R7, Q-6/Q-7 via DEC-24).

### [TASK-13] Core: HMAC decision chain, decision writer, courtside lint

- VISUAL CRITERION: LOGIC-ONLY — surfaces at TASK-15 (1st of 2 in a row).
- Test approach: unit T21/T22/T23 · Dependencies: [TASK-12] · Risk: med (crypto chain correctness)
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-13.md](gates/G5-TASK-13.md))

### [TASK-14] API: GET /api/gates, POST /api/decisions (server-enforced F6/F7/F19)

- VISUAL CRITERION: LOGIC-ONLY — surfaces at TASK-15 (2nd of 2 — at budget, rule 9).
- Test approach: integration T24 · Dependencies: [TASK-13] · Risk: med
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-14.md](gates/G5-TASK-14.md))

### [TASK-15] The Gate card UI: verify checklist, decide actions, async copy, next-up dimming

- VISUAL CRITERION: spec §Visual — the full gate interaction in the browser.
- Test approach: manual-in-harness (logic covered by T21–T24) · Dependencies: [TASK-14] · Risk: med
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-15.md](gates/G5-TASK-15.md))

### [TASK-16] Harness agent-session simulator + browser-only cycle demo

- VISUAL CRITERION: click "simulate next agent session" → page live-updates to the
  acted-on state (task done / revise, agent working, new narration).
- Test approach: unit T25 + manual-in-harness · Dependencies: [TASK-15] · Risk: med
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-16.md](gates/G5-TASK-16.md)) — **S5 complete**

---

## Slice S6 — pre-game (spec: [specs/pre-game.md](specs/pre-game.md)) · gates auto-approved (DEC-20)

### [TASK-17] Doctor core + courtside CLI (doctor/lint/dev)

- VISUAL CRITERION: terminal table from `npx courtside doctor` (badge lands TASK-18).
- Test approach: unit T26/T27 · Dependencies: [TASK-16] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-17.md](gates/G5-TASK-17.md))

### [TASK-18] /api/doctor + preflight panel + header health badge

- VISUAL CRITERION: green badge → click → preflight panel; break state → badge flips red live.
- Test approach: manual-in-harness + T26 reuse · Dependencies: [TASK-17] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-18.md](gates/G5-TASK-18.md)) — **S6 complete**

---

## Slice S7 — tape-and-huddle (spec: [specs/tape-and-huddle.md](specs/tape-and-huddle.md)) · gates auto-approved (DEC-20)

### [TASK-19] Game Tape viewer (filmstrip + missing/unverifiable state)

- VISUAL CRITERION: gate card grows a filmstrip — frame-001 renders (mtime shown,
  verified badge), frame-002 shows the designed missing/unverifiable state (DEC-4);
  tape is evidence, never verification (R8 — no auto-checking).
- Test approach: unit T28 (tape resolution) + manual · Dependencies: [TASK-18] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-19.md](gates/G5-TASK-19.md))

### [TASK-20] The Huddle (Tier 1 deterministic briefing)

- VISUAL CRITERION: "The Huddle" button → since-you-last-looked briefing computed
  from state + decision log + SQLite last-seen; all facts verified-provenance.
- Test approach: unit T29 (briefing builder) + manual · Dependencies: [TASK-19] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-20.md](gates/G5-TASK-20.md)) — **S7 complete**

---

## Ship check (TASK-21) · v0.1 cut-line

### [TASK-21] Ship-check vs PRD §12 criteria + final wrap

- Source: PRD §12 ship criteria; DEC-20 (final report mandate)
- Description: prove both ship criteria, sweep rules compliance, finalize docs.
- Acceptance criteria: (1) full async gate cycle browser-only — proven at TASK-16
  and scripted in README's 2-minute demo; (2) fresh clone → `npx courtside` all
  green — proven: clone + npm install + doctor (auto-scaffolds fixture) + 52/52
  check in **14 seconds** (criterion: <15 min); rule-12 line counts brought under
  200 (App 195, Gate 183 after splits); README final; all plan artifacts current.
- VISUAL CRITERION: README's "2-minute demo" runs end-to-end in the browser.
- Test approach: timed clone simulation + full check + manual demo
- Dependencies: [TASK-20] · Risk: low
- Status: done (auto-approved 2026-06-10 · report: [gates/G5-TASK-21.md](gates/G5-TASK-21.md)) — **v0.1 LITE COMPLETE, awaiting human end review**

### [TASK-22] Copy diet & dedupe (human design review, DEC-28)

- Source: Kyle's design review 2026-06-10 (6 points + duplication audit); DEC-28
- Description: remove duplication and agent-voice prose from the dashboard; quality
  over spec citations.
- Acceptance criteria: duplicate Agent card deleted; provenance badges glyph-only
  (✓/◇, label on hover); all spec-citation/explainer sentences removed; gate card
  shows decision essentials with report+tape behind an expander and a label-less
  source ref; verify heading is a `Verify · n/N` counter; scorebug labels/subs
  shortened, duplicate task sub-line gone; demo strip reads DEMO with
  "agent's next session ▸" and a working "reset ↺" button (no terminal).
- VISUAL CRITERION: default view reads ~half the words; reset button restores the
  demo live.
- Test approach: T30 (resetFixture) + existing suite + Kyle's eyes
- Dependencies: [TASK-21] · Risk: low
- Status: done (2026-06-10 · report: [gates/G5-TASK-22.md](gates/G5-TASK-22.md)) — awaiting Kyle's visual pass

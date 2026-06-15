# Slice spec — S3 "mission-control"

- **Status:** ✅ auto-approved (GATE 2, autonomous mode DEC-20) · 2026-06-10
- **Source:** [01-system-map.md §3](../01-system-map.md) (S3, DEC-8) · **Features:** F2 backlog · F3 progress · F5 ledgers

**Goal:** the full read-only dashboard — every plan object visible and drillable
(PRD G1), all values contract-derived, zero write paths.

## Behaviors

### B1 — Backlog view (F2)

1. Tasks grouped by `slice`, each a card row: mono id, title, **status chip**
   (done=ok, in-review=accent, revise/blocked=risk, in-progress=info, todo=muted),
   **risk badge** (mock tints: low=ok, med=accent, high=risk), and the **visual
   criterion shown prominently** — or a `LOGIC-ONLY → surfaces at {surfacesAt}` chip.
2. Click (native `<details>`) expands the full card: sourceRef (mono), deps, commit
   (short), rejection counter **shown in risk color when > 0** (F19 visibility).
3. **Mini-graph:** per slice, tasks ordered by dependency depth and rendered as an
   arrow strip (`TASK-10 → TASK-12 → …`) — pure `depsDepth` helper, T11. Cycles or
   unknown deps must not crash (depth caps; unknown dep renders as plain chip).

### B2 — Progress (F3)

1. Milestone card (side column, mock's `.milestone-bar`): accent fill bar of
   done/total for the **active slice** + "N of M tasks" meta row.
2. "Tasks done over time": cumulative count of `decisions[]` by local day rendered
   as a tiny inline SVG sparkline + total. Pure `cumulativeByDay` helper, T12.
   (Honest with sparse fixture data: one point renders as one step.)

### B3 — Ledgers (F5)

1. Side-column card, four rows: **Open questions** (count + oldest age — risk color
   at ≥ 3 days, "itching" per mock's 6d example), **Tech debt** (count + newest age),
   **Decisions logged** (count + last date), **State freshness** (`generatedAt` ago:
   ok < 1 h, muted < 24 h, else risk + "stale" — R1 surface). Helpers `ageBucket`
   (T13) / `freshness` (T14).
2. Each row expands (`<details>`) to the full list: questions show text, options,
   labeled recommendation, blocking task ids, age; debt shows text/task/age;
   decisions show text/by/gateId/commit. Read-only — answering is F9 (M2).

### B4 — Layout

Mock order: side column = Progress · Ticker · Ledgers; main column = StatusCard ·
Backlog. No gate card (S5), no health badge (S6), no huddle/tape (S7).

### B5 — Tests (vitest, helpers in `src/lib/derive.ts`)

T11 depsDepth (chain depths, unknown dep → 0, self/cycle capped) · T12
cumulativeByDay (ordering, multi-per-day, empty) · T13 ageBucket thresholds ·
T14 freshness thresholds.

**Out of scope:** any mutation, gate UI, doctor, huddle, tape, theming beyond tokens.
**New deps:** none. **Open questions:** none.

## Visual criterion (slice)

Dashboard shows: backlog with 5 fixture tasks (TASK-15 carries the LOGIC-ONLY chip;
all sourceRefs visible on expand), milestone bar at 1/5 done (battle-core: TASK-11
done), ledgers reading "questions 1 · oldest 6d+ (risk red)", "debt 1", "decisions 1",
freshness per fixture age. Everything navigable without leaving the page.

---

GATES 3+4 (auto, DEC-20): cards TASK-7 backlog · TASK-8 progress · TASK-9 ledgers;
order 7→8→9.

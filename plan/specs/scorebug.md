# Slice spec — S2 "scorebug"

- **Status:** awaiting GATE 2
- **Date:** 2026-06-10 · **Source:** [01-system-map.md §3](../01-system-map.md) (S2, approved DEC-8)
- **Features:** F1 status board · F4 narration ticker · F18 provenance badges (badge half) · design language lands
- **Gate question:** _Spec confirmed, questions answered?_

**Goal:** the dashboard starts looking and reading like Courtside. The mock's design
language (tokens, type, dark theme) lands once and for all; the scorebug strip
answers "what is the agent doing right now?" at a glance; the ticker narrates over
time; and every agent-authored sentence is visibly marked as _claimed_ — enforced so
it can't silently regress (rule 14).

---

## 1. Behaviors

### B1 — Design language (tokens + vendored type)

1. The mock's `:root` tokens become the app's theme: bg `#14171C`, surface `#1C2128`,
   surface2 `#222933`, line `#2A313B`, text `#E8EAED`, muted `#8B94A1`, accent
   `#E8A33D` (+ accent-ink), ok `#4CAF7D`, risk `#D06262`, info `#6B93C4`, radius
   10px — defined as CSS variables and mapped into Tailwind (v4 `@theme`) so
   utilities like `bg-surface` / `text-muted` / `border-line` exist.
2. Type stack vendored locally via `@fontsource` packages (rule 15 — zero CDN):
   **Barlow Condensed** (500/600/700) for display/numbers/states, **IBM Plex Sans**
   (400/500/600) for body, **IBM Plex Mono** (400/500) for ids/timestamps/labels.
3. Front Office is the only look; the runtime theme _engine_ stays M3 (no toggle).
4. Loading and refusal states (TASK-3) restyle onto tokens; refusal stays red/loud.

### B2 — Header (mock layout, v0.1 content only)

1. Brand wordmark "COURT**SIDE**" (display face, accent on "side"), then a mono chip
   `Phase {phase} · {slice}` from state. No health badge yet (F0/S6), no theme toggle
   (M3).

### B3 — Scorebug strip (F1)

Four cells, every value contract-derived (PRD F1: phase, slice, active task, agent
state, last narration — phase/slice live in the header chip):

1. **Agent** — `agent.state` humanized ("parked at gate"); accent-colored with the
   mock's pulsing dot when `parked_at_gate` or `blocked` (things awaiting/blocked on
   the human side get the accent — PRD §7); sub-line "since {local time} · {ago}".
   `prefers-reduced-motion` disables the pulse (mock + PRD §7).
2. **Last narration** — `agent.narration` (body face) with a **◇ agent-reported
   badge** (B5); sub-line: current task id + its title from `tasks[]`. Narration
   absent → "—".
3. **Active task** — `agent.currentTask` + that task's `status` and `risk` (mono).
   Absent or not found in `tasks[]` → "—" (never guess).
4. **Last test run** — newest `events[]` entry with `kind: "test_run"`: its text +
   provenance badge + ago. None → "no runs recorded".
   _(Delta vs mock, recorded: the mock's "Session" cell is dropped in v0.1 — the v0
   contract has no session data and we don't invent any; SQLite sessions arrive S4.)_

### B4 — Ticker (F4)

1. Side-column card listing all `events[]` newest-first: mono timestamp (local
   HH:MM), kind-colored dot (narration=info, test_run/lint=ok, gate=accent,
   audit/capture/push=muted), text, provenance badge.
2. Empty events → "no events yet" quiet line. Long texts wrap (contract caps at 500).
3. Static render (recomputed on reload); live updates arrive with S4's WebSocket —
   explicitly out of scope here.

### B5 — Provenance badges + enforcement (F18 badge half; rules 14, CLAUDE.md delta a)

1. One `ProvenanceBadge` component: `verified` → solid ✓ badge (ok-colored);
   `claimed` → outlined ◇ badge labeled "agent-reported" (muted). Visually distinct
   at a glance per PRD §5.
2. **Structural enforcement:** event text and narration render only through an
   `EventText`-style component that _requires_ a `provenance` prop and applies
   styling internally. Verified styling exists nowhere else in the codebase — there
   is no class/constant a future component could grab to dress a claim as a fact.
   `agent.narration` is hard-wired `claimed` (agent-authored by definition, §5).
3. Layout grid per mock (main 1.6fr / side 1fr): main column = the restyled status
   card from TASK-3 (agent detail); side = ticker. Gate card (S5), backlog (S3),
   progress/ledgers (S3) intentionally absent — no placeholder fakes.

### B6 — Tests (vitest; pure helpers only, components human-verified per rule 19)

| #   | Test                                    | Expects                                                         |
| --- | --------------------------------------- | --------------------------------------------------------------- |
| T7  | `formatAgo`                             | "3 min ago" / "6 d ago" buckets correct at boundaries (min/h/d) |
| T8  | `latestEventOfKind(events, 'test_run')` | newest by `ts`; `undefined` when none                           |
| T9  | `humanizeAgentState`                    | `parked_at_gate` → "parked at gate" (all four enum values)      |
| T10 | `kindColor` mapping                     | every schema event kind maps to a defined token, no fallthrough |

## 2. Edge cases & non-goals

- Fixture ages grow with real time (DEC-6) — "ago" strings are computed live and may
  read days/weeks; correct behavior, not a bug.
- No live re-render of "ago" values without reload (S4).
- Out of scope: theme toggle/Ballhalla (M3) · health badge (S6) · session stats (S4)
  · any gate UI (S5) · backlog/progress/ledgers (S3) · re-run proofs (F18 full, M2).

## 3. File layout (each ≤200 lines)

```
src/theme.css                      — tokens (@theme) + font imports
src/components/Header.tsx
src/components/Scorebug.tsx
src/components/Ticker.tsx
src/components/Provenance.tsx      — ProvenanceBadge + EventText (the only claim/fact styling)
src/components/StatusCard.tsx      — TASK-3 content restyled
src/lib/format.ts                  — formatAgo, humanizeAgentState, kindColor, latestEventOfKind
src/lib/format.test.ts             — T7–T10
src/App.tsx                        — slims to fetch shell + layout
```

## 4. Visual criterion (slice-level)

`npm run dev` → `localhost:4310`: the page is **dark** (mock's exact palette), brand
wordmark in condensed display type, mono phase chip. The scorebug strip shows
**parked at gate** pulsing in amber with "since 7:42 PM · {ago}", the narration with
an outlined **◇ agent-reported** badge, **TASK-12 · in-review · med**, and the GUT
test line with a solid **✓ verified** badge. Ticker on the right lists 4 fixture
events, newest first, dots colored by kind, each with its badge. Break the fixture →
the refusal state still appears, now token-styled. System-font fallback gone — type
is visibly Barlow Condensed / Plex.

## 5. Traceability, dependencies, open questions

- Sources: PRD §6 (F1, F4), §5 + R6 (provenance), §7 (accent discipline, motion,
  reduced-motion); mock tokens/type/layout; CLAUDE.md rules 2 (delta a), 14, 15;
  DEC-6/8.
- **Dependency ask (rule 16, the GATE-1 flagged fonts):** `@fontsource/barlow-condensed`,
  `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` — static, audited,
  license-clean (OFL) font packages; no code, no network at runtime. Nothing else new.
- **New open questions: none.** (Q-6/Q-7 affect S5, not S2.)

---

## ⛩ GATE 2 — S2 spec confirmed (including the three @fontsource packages)?

Approval unlocks Phase 3: S2 task cards in the backlog (expected ~3: tokens+type+
header · scorebug+status card · ticker+provenance+helper tests).

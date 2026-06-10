# Phase 0 — Intake & Inventory

- **Status:** complete, awaiting GATE 0
- **Date:** 2026-06-10
- **Gate question (framework §1):** *Is the corpus complete and scope right?*
- Every file below was read in full before being described here (CLAUDE.md rule 5).

---

## 1. The corpus

| # | File (actual path today) | Referenced in CLAUDE.md / kickoff as | Version | Role | Precedence |
|---|---|---|---|---|---|
| 1 | `CLAUDE.md` | — | — | Always-on rules for this repo; maps the Godot-flavored framework onto this web app | Binding rules |
| 2 | `Courside Docs/framework-v2.md` | `docs/framework-v2.md` | v2 | Process: phases 0–5, gates, narration, task cards, completion reports, audits | Process law |
| 3 | `Courside Docs/courtside-prd.md` | `docs/prd.md` | Draft v1.1 | **The design doc.** Features, behavior, architecture, security, cut-lines | **Wins on all features/behavior** |
| 4 | `Courside Docs/courtside-mock.html` | `docs/mock.html` | built vs PRD v1.0 | Design language only: tokens, type, layout, theme system, Gate interaction | Reference only; PRD wins on conflict |
| 5 | `Cousrside Specs/state.schema.json` | `spec/state.schema.json` | courtside/v0 | **The data contract.** JSON Schema (draft-07) for `/plan/state.json` | Law for data shapes & field names (rule 13) |
| 6 | `Cousrside Specs/state.sample.json` | `spec/fixtures/state.sample.json` | courtside/v0 | Sample fixture: a Godot game project mid-Phase-5 with one pending gate; the harness's demo data | Must validate against #5 |

Not part of the corpus: `.DS_Store` (macOS noise; gitignore at scaffold time).
Nothing else exists in the repo — no code, no `package.json`, no git history, no README yet (expected before scaffolding).

**Note the folder-name typos:** `Courside Docs/` and `Cousrside Specs/` differ from the canonical
`docs/` and `spec/` paths that CLAUDE.md and the kickoff prompt use. See Q-1 in
[open-questions.md](open-questions.md).

---

## 2. What each document says

**framework-v2.md** — The operating procedure. Phases: 0 inventory → 1 system map →
**1.5 harness first** → 2 slice specs → 3 task decomposition → 4 sequencing → 5 per-task
loop. Every phase ends at a gate the human must explicitly approve. Every task needs a
visual criterion (or a declared logic-only exemption, max 2–3 in a row). Mandatory
narration (why + what's next), completion-report format, and audit cadence. Written in
Godot terms (DebugBattle, GUT, F5); §6 of this inventory maps those to this web app.

**courtside-prd.md (v1.1)** — The product: a local-first web dashboard that makes an
agentic gated workflow visible and decidable. Architecture (§5): the agent writes
`/plan/state.json` + gate files; a Node server watches, parses, logs to SQLite, and
serves a React app over WebSocket. Gates are **async-first** (agent parks the gate, ends
its turn; human decides whenever; agent reads a decisions-inbox at next session start).
Two non-negotiable principles: **verified vs. claimed provenance** on every datum (§5,
F18, R6) and the **security model** (127.0.0.1 bind, token auth, HMAC-signed append-only
decision log, answers-as-data). Features are grouped M0–M4 with a hard v0.1 cut-line
(§12, restated in §4 below).

**courtside-mock.html** — Design language: dark UI, tokens (`--bg #14171C`, accent
`#E8A33D`, ok/risk/info colors, 10px radius), type stack (Barlow Condensed display,
IBM Plex Sans body, IBM Plex Mono data), and the layout grammar: header with health
badge, scorebug strip, main column with the **Gate** card (verify checklist unlocks
Approve; everything below it locked/dimmed until cleared), side column with
milestone/ticker/ledgers, toast on gate clear. Its own header comment declares it stale
vs v1.1 — same three deltas CLAUDE.md rule 2 lists (see §5). It also demos M3 material
(Ballhalla theme toggle, achievements) which is design reference, **not** v0.1 scope.

**state.schema.json** — Contract v0. Top level requires `schema`, `phase`, `agent`,
`gates`, `tasks`, `events` (`slice`, `generatedAt`, `questions`, `debt`, `decisions`
optional). Enums for agent state, gate type/status, task status (includes `revise` and
`blocked` for the F19 rejection flow), event kind, and `provenance: verified|claimed`.
Patterns for task ids (`TASK-n`), gate ids (`G0`–`G5(-suffix)`), commit SHAs.
`additionalProperties: false` throughout — the contract is closed.
Two things the schema *describes but cannot enforce* (they land in `courtside lint` /
generated types): the conditional "visualCriterion required unless logicOnly, then
surfacesAt required," and referential integrity (deps / surfacesAt / blocking pointing
at real tasks — the fixture's `surfacesAt: TASK-16` points outside its own task list).

**state.sample.json** — A believable mid-project snapshot of a *consuming* Godot game
(slice `battle-core`, agent parked at gate `G5-TASK-12`, five tasks across all statuses,
one 6-day-old open question blocking a task, one debt item, one logged decision, four
events mixing verified and claimed provenance). **Manually cross-checked field-by-field
against the schema: it conforms.** (Mechanical validation is an early vitest task —
rule 17.) It references companion files that don't exist in the repo: two tape frames,
one artifact log, one decision-inbox file — see Q-3.

---

## 3. Precedence rules (how conflicts resolve)

1. **PRD v1.1** wins on features and behavior. Always.
2. **state.schema.json** wins on data shapes and field names (CLAUDE.md rule 13).
   Concretely: PRD §10's sketch shows `payload_ref` / `visual_criterion` / `source_ref`;
   the schema says `payloadRef` / `visualCriterion` / `sourceRef`. §10 is labeled
   "v0 sketch" — the schema's camelCase names are law. No open question needed.
3. **mock.html** governs only tokens, type, layout, theme system, Gate interaction.
4. Known PRD-over-mock deltas (CLAUDE.md rule 2, confirmed in the mock's own header):
   - (a) Mock's gate meta row renders agent claims ("self-audit: 0 findings") with
     verified styling → F18 requires distinct ✓-verified vs ◇-claimed badges.
   - (b) Mock flips agent to "running" instantly on approval → v1.1 gates are async;
     approval shows "decision logged · agent acts next session."
   - (c) Huddle, tape filmstrip, rejection states aren't mocked → design from the PRD
     using the mock's token system; present at their gates.

---

## 4. Scope — v0.1 "Courtside Lite" (PRD §12 M1, nothing else)

### In scope (build this)

| Feature | What ships in v0.1 | Source |
|---|---|---|
| F0 | Preflight wizard + `courtside doctor` (pass/warn/fail + fix-it lines; safe auto-fixes only; header health badge) | PRD §6 M0 |
| F1–F5 | Status board · backlog view · progress · narration ticker · ledgers with age indicators | PRD §6 M1 |
| F6 | Gate inbox — decision cards, Approve / Reject-with-comment / Request changes, decisions logged | PRD §6 M2, §12 |
| F7 | Verify mode — interactive checklist; approval locked until all steps checked or skipped-with-reason | PRD §6 M2, §12 |
| Async loop | File contract + `/plan/decisions-inbox/` only — **no MCP in v0.1** | PRD §5, §12 |
| F19 | Rejection basics: comment required, `revise` state, rejection counter, 3 rejections auto-block | PRD §6 M2, §12 |
| Security | 127.0.0.1 bind · token auth · HMAC-signed append-only decision log · answers-as-data | PRD §5, R7; rule 15 |
| F17 | Game Tape **viewer** only (capture utility belongs to the consuming project's harness) | PRD §12 |
| F18 (partial) | Verified/claimed **badges rendered everywhere** — launch requirement per R6; type-system-enforced per rule 14. (The *re-run-proofs* half of F18 is M2.) | PRD §5, R6, §12 |
| F20 Tier 1 | Deterministic Huddle: template-generated catch-up diff from state + decision log + last-seen timestamp; zero AI | PRD §6 M2, §12 |

**Ship criteria (PRD §12):** a full task cycle — gate posted → decided in the UI →
agent acts on it next session — completes across two sessions without touching the
terminal; and a fresh clone goes from `npx courtside` to all-green checks in <15 min.

### Out of scope (flag as scope creep if it appears in any task card — rule 7)

MCP live mode · F8 click-to-ask · F9 question responder · F16 GitHub connect ·
F18 re-run hooks · F20 Tier 2 narrative huddle (all M2) — F10 theme engine /
Ballhalla pack / achievements · F11 XP & metrics · F12 session recap (all M3) —
F13–F15 OSS packaging, npx publishing, engine-agnostic hooks (M4) — multi-user,
cloud, git-diff rendering, non-Claude adapters (v1 cut-line) — remote/mobile access
(non-goal, OQ5 parked).

---

## 5. Discrepancies & gaps found (what GATE 0 should rule on)

| # | Finding | Severity | Handling |
|---|---|---|---|
| 1 | Doc folders are `Courside Docs/` + `Cousrside Specs/` (typos), not the canonical `docs/` + `spec/` paths every rule references | Medium | **Q-1** — recommend normalizing at scaffold |
| 2 | Not a git repository; rule 20 requires commit-per-task | Medium | **Q-2** — recommend `git init` at scaffold |
| 3 | Fixture references files that don't exist: `plan/tape/TASK-12/frame-001.png`, `frame-002.png`, `plan/artifacts/gut-run-0610-1941.log`, `plan/decisions-inbox/G5-TASK-11.json` | Medium | **Q-3** — placeholders + graceful missing-file states |
| 4 | Ship criterion says "`npx courtside`" but npx packaging (F13) is M4 | Low | **Q-4** — interpret as local CLI |
| 5 | Fixture ages drift as real time passes (Q-7's "6 days" is true only today) | Low | **Q-5** |
| 6 | Mock loads fonts from Google Fonts CDN; rule 15 forbids outbound calls | Low | **Resolved by rule 15:** vendor the three font families locally at build time. The *faces* are design language; how they load is implementation. |
| 7 | Schema's conditional rules + referential integrity not mechanically enforceable in JSON Schema draft-07 | Info | Enforced in `courtside lint` + generated types — already PRD behavior (§10), noted so it lands in the lint slice spec |
| 8 | PRD carries its own unresolved questions; OQ1 (approval friction) and OQ4 (report structure) affect v0.1 slices | Info | Imported as **Q-6**, **Q-7**; answers needed by Phase 2 at the latest |

Full options + recommendations: [open-questions.md](open-questions.md).

---

## 6. Framework → web-app mapping (per CLAUDE.md)

| framework-v2.md says (Godot) | In this repo means |
|---|---|
| DebugBattle scene, "press Play (F5)" | `npm run dev` → dashboard at `localhost:4310` rendering the sample fixture |
| Harness (Phase 1.5) | Dev server + fixture working from the first task onward (rules 8–10) |
| GUT unit tests | vitest (rule 17) |
| Headless engine run | Node processes; `npm run check` (lint + format + tests) stays green (rule 18) |
| On-screen debug panel | The dashboard itself is the observability surface; doctor/health badge covers self-state |
| Engine checks in doctor (F0) | Plugin-based per PRD §6; exact check list for v0.1 is a Phase 2 spec decision |

---

## 7. Deferred (noted now, decided in later phases — not GATE 0 blockers)

- Which doctor checks run meaningfully against the sample fixture vs a real consuming
  project (Phase 2, doctor slice spec).
- How `state.json` freshness/staleness is detected and surfaced (Phase 2; R1).
- Dependency choices — schema validator (e.g. ajv), server framework, WebSocket lib —
  each requires asking first (rule 16); will be proposed with the relevant task cards.

---

## GATE 0

**Question to the human: is this corpus complete, and is the v0.1 scope in §4 the right
cut?** Approval unlocks Phase 1 (system map & slicing → `/plan/01-system-map.md`).
Q-1 through Q-5 in open-questions.md would ideally be answered alongside this gate;
Q-6/Q-7 can wait until Phase 2.

---

## ✅ GATE 0 outcome (2026-06-10)

**Approved** by the human; discrepancy handling delegated to agent judgment (DEC-1).
Close-out actions, all completed the same day:
- Q-1→A: corpus moved to canonical paths — the "actual path today" column in §1 is
  now historical; the canonical column is reality (DEC-2).
- Q-2→A: `git init` on branch `main`; `.gitignore` + README hub added. Remote URL
  pending from human (DEC-3, DEC-7 for the placeholder git identity).
- Q-3→A, Q-4→A, Q-5→A per recommendations (DEC-4…6).
- Q-6/Q-7 remain open for Phase 2, leaning to recommendation A.

Phase 1 (system map & slicing) began immediately after close-out.

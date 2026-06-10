# Phase 1 — System Map & Slicing

- **Status:** proposal, awaiting GATE 1
- **Date:** 2026-06-10
- **Gate question (framework §1):** *Approve slices + first slice?*
- Scope is exactly the v0.1 cut approved at GATE 0 ([00-inventory.md §4](00-inventory.md)).

---

## 1. Two run modes (this framing drives everything below)

| Mode | Where it runs | What it watches | Who uses it |
|---|---|---|---|
| **Harness mode** | this repo, `npm run dev` → `localhost:4310` | [spec/fixtures/](../spec/fixtures/) sample data | us, every task, from S1 onward (CLAUDE.md rules 8–10) |
| **Real mode** | a consuming project (e.g. the Ballhalla game repo) | that repo's `/plan/` | the end user, after v0.1 ships |

Same code, different plan-directory path. The fixture *is* a believable consuming
project's state, so harness mode exercises real code paths — no demo-only logic
(per DEC-6, even ages use the real clock). As slices need them, the fixture grows
companion files under `spec/fixtures/` shaped like a real `/plan/` tree (DEC-4);
`state.sample.json` stays the seed.

## 2. Component map

```
spec/state.schema.json ──(codegen, build-time)──▶ generated TS types
        │                                              │
        ▼                                              ▼
┌─────────────────┐     ┌──────────────────────────────────────────┐
│ plan dir         │     │ src/contract — types + ajv validation +  │
│ (fixture | real) │     │ Verified/Claimed provenance types        │
└────────┬────────┘     └──────────────┬───────────────────────────┘
         │ file-watch                  │ shared by everything below
         ▼                             │
┌─────────────────────────────────────┴────────┐   ┌─────────────────────────┐
│ src/server (Node, 127.0.0.1 only, token auth) │   │ src/cli — `courtside`   │
│  watcher → parse → validate → SQLite event    │   │ bin: dev · doctor · lint │
│  log → WebSocket broadcast                    │   │ (repo-local, DEC-5)      │
│  decision writer: HMAC-signed append-only log │   └────────────┬────────────┘
│  + /plan/decisions-inbox/<id>.json            │                │ shares
└──────────────────────┬───────────────────────┘   ┌────────────▼────────────┐
                       │ websocket                 │ src/core — pure logic:   │
                       ▼                           │ ages, freshness, huddle  │
┌──────────────────────────────────────────────┐   │ diff, HMAC sign/verify,  │
│ src/web (React + Tailwind, mock's tokens)     │   │ doctor checks            │
│  F1 status · F2 backlog · F3 progress ·       │   │ → vitest-first (rule 17) │
│  F4 ticker · F5 ledgers · F6 gate inbox ·     │   └─────────────────────────┘
│  F7 verify · F17 tape viewer · F19 rejection ·│
│  F20 huddle · F18 badges everywhere           │
└──────────────────────────────────────────────┘
```

| Component | Responsibility | PRD source |
|---|---|---|
| `src/contract` | Generated types from the schema (never hand-written — rule 13), ajv validation, `Verified<T>`/`Claimed<T>` provenance types that make claim-as-fact rendering a *compile error* (rule 14) | §5, §10, F18 |
| `src/core` | Pure, UI-free logic: age/freshness math, deterministic huddle diff, decision-log HMAC sign/verify, doctor check functions. Everything here is vitest-first | §5, F0, F20, R1 |
| `src/server` | Local HTTP + WebSocket; watches the plan dir; parses/validates state; SQLite event log + last-seen; writes decisions (inbox JSON + signed append-only log); token auth; binds 127.0.0.1 | §5, R7 |
| `src/web` | The dashboard. Mock's design language (tokens, type, Gate pattern); async-gate copy per delta (b); provenance badges on every datum | §6, §7, mock |
| `src/cli` | `courtside` bin: `dev`, `doctor`, `lint` (DEC-5: repo-local, not published) | F0, §10 |
| `spec/` | The law (schema) + the harness's world (fixtures) | §10 |

**Data flows.**
- *Read path:* plan files → watcher → ajv validate → SQLite event log → WS → React.
  Invalid state never renders as truth — it flips the health badge with the error.
- *Decision path (async loop):* human acts in F6/F7 → server appends to HMAC-signed
  decision log + writes `decisions-inbox/<id>.json` → UI shows "decision logged ·
  agent acts next session" (delta b). The agent reads the inbox at next session start.
- *Doctor path:* same check functions run via CLI (`courtside doctor`) and via UI
  (preflight + header health badge) — one implementation, two surfaces (F0).

**Security boundaries (R7, ships inside v0.1, not after):** bind 127.0.0.1 only ·
token printed at server start, required by browser session · decisions HMAC-signed
with a local secret outside git (`.env` is gitignored) · human answers stored as
structured data, never injected as instructions · no outbound calls at all in v0.1
(GitHub connect is M2; fonts vendored per inventory §5.6).

## 3. Slices (vertical, each ends visible in the harness)

| # | Slice | Features | What you literally see when it's done |
|---|---|---|---|
| S1 | **walking-skeleton** *(= framework Phase 1.5, harness first)* | scaffold, contract codegen, fixture validation | `npm run dev` → `localhost:4310` shows the Courtside header, "fixture validates ✓ courtside/v0", and the agent's state + narration read live from the fixture. `npm run check` green. |
| S2 | **scorebug** | F1, F4, F18 badges + provenance types | The mock's dark design language lands (vendored fonts, tokens). Scorebug strip with agent state/narration; ticker feed; every claimed event carries the outlined ◇ agent-reported badge, verified ones ✓. |
| S3 | **mission-control** | F2, F3, F5 | Backlog cards (status, risk, deps, visual criterion), milestone progress, ledgers with age indicators ("Q-7 open 6 days" itches in red). The full read-only dashboard. |
| S4 | **live-wire** | server core, security | Edit the fixture file → dashboard updates without reload. Server binds 127.0.0.1, prints a token, browser without it gets denied. Events accumulate in SQLite. |
| S5 | **the-gate** | F6, F7, F19, signed decisions | The signature Gate card: verify checklist unlocks Approve; approving writes the signed decision + inbox file and shows "decision logged · agent acts next session"; rejecting requires a comment, flips the task to `revise`, increments the counter (3 = auto-block + discussion state). Next-up section sits dimmed below until cleared. |
| S6 | **pre-game** | F0 doctor | `courtside doctor` in the terminal and the preflight panel in the UI show the same pass/warn/fail checks with fix-it lines; header health badge goes green; break the state file on purpose → badge flips red and links to the failing check. |
| S7 | **tape-and-huddle** | F17 viewer, F20 Tier 1 | Gate card grows the tape filmstrip (placeholder frames render; a missing frame shows the designed "unverifiable" state — DEC-4). The Huddle button answers "what's going on?" with the deterministic since-you-last-looked briefing. |

**Coverage check against PRD §12 M1:** F0→S6 · F1/F4→S2 · F2/F3/F5→S3 · F6/F7/F19→S5 ·
security→S4+S5 · F17 viewer→S7 · F18 badges→S2 onward · F20 T1→S7 · ship criterion
"full async cycle in UI"→S5 · "fresh clone to all-green in <15 min"→S1+S6. Nothing
from M2+ appears in any slice (rule 7 tripwire stays armed).

## 4. Why this order

1. **S1 first is non-negotiable** — framework Phase 1.5: the harness exists before any
   feature, and `npm run dev` works from the first task onward (rules 8–10).
2. **See before decide (S2–S3 before S4–S5):** the read-only views render the contract
   with zero write paths — cheapest possible de-risking of the data contract, and the
   human gets a useful dashboard at the earliest possible moment (G1).
3. **Provenance types land with the first real UI (S2)** because rule 14 is a
   type-system guarantee — retrofitting it after more views exist multiplies the cost.
4. **S4 before S5:** gate decisions need a server that can write files and sign logs.
   Security ships with the first server process, not as a later hardening pass (R7).
5. **S6 after the things it checks exist** (schema validation, server, plan dir) but
   before ship — doctor is half the ship criterion.
6. **S7 last:** the tape viewer decorates S5's gate card; the huddle needs S4's SQLite
   last-seen. Both are leaf features nothing else depends on.

S2+S3 could merge if pace is good; split keeps each gate review ~one sitting.

## 5. First slice proposal — S1 walking-skeleton

**Goal:** a permanently working harness. Scaffold the app (TypeScript strict, React,
Tailwind, vitest, ESLint+Prettier, `npm run check`), generate contract types from
[state.schema.json](../spec/state.schema.json), validate the fixture with ajv in a
vitest test **and** at app load, and render a minimal fixture-driven page on
`localhost:4310`: header, validation status, agent state + narration. Dev server binds
127.0.0.1 from day one. No design-language work yet (system fonts; tokens land in S2).

**Visual criterion:** open `localhost:4310` → Courtside header; a green
"fixture validates ✓ courtside/v0" line; "agent: parked_at_gate — *Wired range overlay
into DebugBattle; all 14 GUT tests green. Next: your review.*" — all read from the
fixture, not hardcoded. Breaking the fixture on purpose shows the validation error.

**Dependency ask (rule 16 — approve at GATE 1).** All boring, widely-audited,
huge-install-base packages:

| Package(s) | Why | Runtime/dev |
|---|---|---|
| `react`, `react-dom` | mandated stack | runtime |
| `typescript` | mandated, strict mode | dev |
| `vite`, `@vitejs/plugin-react` | dev server + build; the standard boring choice for a React SPA | dev |
| `tailwindcss`, `@tailwindcss/vite` | mandated stack | dev |
| `vitest` | mandated test runner | dev |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `prettier` | rule 18 (`npm run check`) | dev |
| `ajv`, `ajv-formats` | reference JSON-Schema validator; `ajv-formats` for the schema's `date-time` checks; later reused by server + lint | runtime |
| `json-schema-to-typescript` | generates the contract types from the schema so no type is ever hand-drifted (rule 13) | dev |

**Known future asks (flagged now, decided at their slices):** S2 — `@fontsource/*`
for vendoring Barlow Condensed + IBM Plex Sans/Mono (no CDN, rule 15). S4 — SQLite
driver: `node:sqlite` is built into this machine's Node 24 (zero dependencies) but the
stack targets Node 20+, vs `better-sqlite3` (works on 20, adds a native dep); plus
`ws` (WebSocket server) and `chokidar` (reliable cross-platform file watching).

## 6. What happens after GATE 1

Phase 2 extracts the S1 slice spec (`/plan/specs/walking-skeleton.md`), resolving
exact behaviors and edge cases; Phase 3 decomposes it into task cards with visual
criteria; Phase 4 sequences them; Phase 5 builds task-by-task, each ending at a
GATE 5 review in the browser.

---

## ⛩ GATE 1

1. Approve the component map (§2)?
2. Approve the seven slices and their order (§3–§4)?
3. Approve **S1 walking-skeleton** as the first slice, including its dependency list (§5)?

# Courtside

A local-first dashboard for human + agent development: see everything your coding
agent does, approve what matters, and feel the progress — without leaving your seat.
Building the **v0.1 "Courtside Lite"** cut ([PRD §12](docs/prd.md)).

> **Status:** pre-code · GATE 1 approved · Phase 2 (S1 slice spec) awaiting GATE 2.
> No `npm run dev` yet — the runnable harness lands with the first build task and
> will serve `localhost:4310` against [the sample fixture](spec/fixtures/state.sample.json).

## The documentation spine

| Doc | Role |
|---|---|
| [docs/prd.md](docs/prd.md) | **The design doc** (v1.1). Wins on all features & behavior. |
| [docs/framework-v2.md](docs/framework-v2.md) | The process: phases, gates, task cards, completion reports. |
| [CLAUDE.md](CLAUDE.md) | Always-on rules; maps the framework onto this web app. |
| [docs/mock.html](docs/mock.html) | Design language only — tokens, type, layout, Gate pattern. |
| [spec/state.schema.json](spec/state.schema.json) | **The data contract** (courtside/v0). Law for shapes & names. |
| [spec/fixtures/state.sample.json](spec/fixtures/state.sample.json) | Sample project state the harness renders. |

## Plan state (live)

| Artifact | What it holds |
|---|---|
| [plan/00-inventory.md](plan/00-inventory.md) | Phase 0: corpus, precedence, scope, findings. **GATE 0 approved 2026-06-10.** |
| [plan/01-system-map.md](plan/01-system-map.md) | Phase 1: components, slices, first-slice proposal. |
| [plan/open-questions.md](plan/open-questions.md) | Ambiguities with options + recommendations. |
| [plan/decisions.md](plan/decisions.md) | Append-only log of human/agent decisions. |
| [plan/tech-debt.md](plan/tech-debt.md) | Debt ledger. |

## Running (future)

Once the harness lands: `npm run dev` → `http://localhost:4310` (binds 127.0.0.1
only, token printed at start) · `npm test` (vitest) · `npm run check` (lint + format
+ tests; CI-green is a standing rule).

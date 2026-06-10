# Courtside

A local-first dashboard for human + agent development: see everything your coding
agent does, approve what matters, and feel the progress — without leaving your seat.
Building the **v0.1 "Courtside Lite"** cut ([PRD §12](docs/prd.md)).

> **Status:** ✅ S1 walking-skeleton shipped (2026-06-10) · Phase 2: S2 "scorebug" spec awaiting GATE 2.

## Run it

```
npm install
npm run dev        # → http://127.0.0.1:4310  (loopback only, fixed port)
npm test           # vitest
npm run check      # typecheck + lint + format + tests — must stay green
```

Note: this is the Vite dev harness. The real Courtside server (token auth printed at
start, WebSocket, SQLite) arrives in slice S4 per the
[system map](plan/01-system-map.md).

## The documentation spine

| Doc                                                                | Role                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [docs/prd.md](docs/prd.md)                                         | **The design doc** (v1.1). Wins on all features & behavior.   |
| [docs/framework-v2.md](docs/framework-v2.md)                       | The process: phases, gates, task cards, completion reports.   |
| [CLAUDE.md](CLAUDE.md)                                             | Always-on rules; maps the framework onto this web app.        |
| [docs/mock.html](docs/mock.html)                                   | Design language only — tokens, type, layout, Gate pattern.    |
| [spec/state.schema.json](spec/state.schema.json)                   | **The data contract** (courtside/v0). Law for shapes & names. |
| [spec/fixtures/state.sample.json](spec/fixtures/state.sample.json) | Sample project state the harness renders.                     |

## Plan state (live)

| Artifact                                                         | What it holds                                 |
| ---------------------------------------------------------------- | --------------------------------------------- |
| [plan/00-inventory.md](plan/00-inventory.md)                     | Phase 0: corpus, precedence, scope. GATE 0 ✅ |
| [plan/01-system-map.md](plan/01-system-map.md)                   | Phase 1: components + slices S1–S7. GATE 1 ✅ |
| [plan/specs/walking-skeleton.md](plan/specs/walking-skeleton.md) | Phase 2: S1 spec. GATE 2 ✅                   |
| [plan/backlog.md](plan/backlog.md)                               | Phase 3/4: task cards + order. GATES 3+4 ✅   |
| [plan/open-questions.md](plan/open-questions.md)                 | Ambiguities with options + recommendations.   |
| [plan/decisions.md](plan/decisions.md)                           | Append-only log of human/agent decisions.     |
| [plan/tech-debt.md](plan/tech-debt.md)                           | Debt ledger.                                  |

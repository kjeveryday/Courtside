# Courtside

A local-first dashboard for human + agent development: see everything your coding
agent does, approve what matters, and feel the progress — without leaving your seat.
This branch contains the **v0.1 "Courtside Lite"** cut ([PRD §12](docs/prd.md)), built
end-to-end under [framework-v2](docs/framework-v2.md) in autonomous mode (DEC-20 —
every gate artifact preserved in [/plan](plan/)).

> **Status:** v0.1 **approved by Kyle inside the dashboard itself** (gate G5-V0-1,
> 5/5 verify steps, signed — DEC-33) · refinements continue on `courtside-lite-v0`
> (latest: TASK-29 daily-driver pass; TASK-28 fixed all 24 adversarial findings).

## Run it (60 seconds)

```
npm install            # Node >= 24 required (node:sqlite + native TS)
npm run dev            # builds UI, resets the demo fixture, starts the real server
                       #   → open the printed http://127.0.0.1:4310/?token=… link
npm run dev:self       # the dashboard pointed at THIS repo's real plan -
                       #   all 28 tasks, the decided v0.1 review gate, real ledgers
npx courtside doctor   # the same checks the header badge runs (all green)
npm run check          # codegen-drift + typecheck + lint + format + 74 tests
```

The harness serves the **sample fixture project** (a Godot game mid-Phase-5,
[spec/fixtures/](spec/fixtures/)) through the real server: token auth on 127.0.0.1
only, live WebSocket updates, SQLite event log, HMAC-signed decisions. Every
`npm run dev` resets the demo to "gate pending — your call, coach."

### The 2-minute demo (the v0.1 ship-criterion loop)

1. Open the token URL → dark mission-control: scorebug, gate card, backlog,
   progress, ticker, ledgers, health badge, Huddle.
2. On the **GATE 5** card: check the 4 verify steps (or skip-with-reason) → Approve.
   The card settles: _decision logged · agent acts next session_; Next-up un-dims.
3. Click **agent's next session ▸** (harness footer) → without reloading:
   agent flips to _working_ on TASK-13, TASK-12 lands as done, ticker grows.
4. Click **The Huddle ▸** → the deterministic since-you-last-looked briefing.
5. Edit `spec/fixtures/sample-project/plan/state.json` → page live-updates; break
   the JSON → red refusal; fix → recovers.

## The documentation spine

| Doc                                              | Role                                            |
| ------------------------------------------------ | ----------------------------------------------- |
| [docs/prd.md](docs/prd.md)                       | **The design doc** (v1.1). Wins on behavior.    |
| [docs/framework-v2.md](docs/framework-v2.md)     | The process: phases, gates, cards, reports.     |
| [CLAUDE.md](CLAUDE.md)                           | Always-on rules (amended by DEC-20).            |
| [docs/mock.html](docs/mock.html)                 | Design language only — tokens, type, Gate.      |
| [spec/state.schema.json](spec/state.schema.json) | **The data contract** (courtside/v0).           |
| [spec/fixtures/](spec/fixtures/)                 | Seed state + sample project the harness serves. |

## Plan state (the paper trail)

[plan/00-inventory.md](plan/00-inventory.md) · [plan/01-system-map.md](plan/01-system-map.md) ·
[plan/specs/](plan/specs/) (7 slice specs) · [plan/backlog.md](plan/backlog.md) (29 task cards) ·
[plan/gates/](plan/gates/) (a completion report per task) · [plan/decisions.md](plan/decisions.md)
(DEC-1…34) · [plan/open-questions.md](plan/open-questions.md) · [plan/tech-debt.md](plan/tech-debt.md) ·
[plan/adversarial-brief.md](plan/adversarial-brief.md) (standing reviewer brief) ·
[plan/session-log.md](plan/session-log.md) (narration trail)

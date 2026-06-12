# Courtside

Your AI coding agent builds. You sit courtside and make the calls.

Courtside is a local dashboard that shows everything your AI agent is doing on your game project — what it built, what it's working on, and when it needs your okay before it keeps going. No terminal. No code to read. Just a clear board and a few yes/no decisions.

## Try it in 60 seconds

```
npm install            # Node >= 24 required
npm run dev            # starts the demo → open the printed link
npm run dev:self       # the dashboard pointed at THIS repo's own plan
npm run dev:new        # start fresh — pick any folder for your game project
```

> **Quick note:** `npm install` only needs to run once. After that, `npm run dev` starts
> everything. Node 24+ is required — run `node -v` to check.

## The 2-minute demo

Open the link that `npm run dev` prints and you'll see a dark mission-control board. Here's the full loop — do these in order:

1. **The gate card is waiting for you.** It shows what the AI built and four things to verify. Check them off (or skip one with a reason), then click **Approve gate**. The card settles: _decision logged · agent acts next session_.

2. **Click "simulate AI session ▸"** at the bottom of the page. Without reloading, the AI flips to working on a new task, the previous task marks done, and the activity feed grows.

3. **Click "The Huddle ▸"** in the header. This is your since-you-last-looked briefing — what shipped, what needs your attention, what's waiting.

4. **Click "ask ▸"** in the header. Try "what is waiting on me?" — it answers from the live board. Try "what does the diamond badge mean?" — it finds the answer in the built-in guide.

5. **Edit the demo file** (`spec/fixtures/sample-project/plan/state.json`) and watch the board update live. Break the JSON — the board shows a clear error. Fix it — the board recovers.

That's the whole loop. In real use, step 2 is your AI agent picking up the approved work and running — no "simulate" button needed.

## Starting a real project

Run `npm run dev:new`, pick a folder, answer a few questions about your game, and the board goes live. Courtside will set up a plan file, a design doc template, and your CLAUDE.md rules — nothing existing gets overwritten.

## What the badges mean

Two badges appear on things the AI wrote:

- **◇** (diamond) — the AI said this. Courtside hasn't independently checked it.
- **✓** (checkmark) — Courtside verified this from a tool or file, not just the AI's word.

The gate card's TL;DR is always ◇ — it's the AI's summary of its own work. The verify steps are how you make sure.

## What Courtside does _not_ do

- It doesn't run your AI agent for you (unless you configure `COURTSIDE_AGENT_CMD` or use the wizard).
- It doesn't send anything outside your machine — no telemetry, no cloud syncing.
- It doesn't write code. Your AI agent does that.

---

## For developers

The build is at **v0.2.0** (branch `courtside-lite-v0`). 34 tasks, DEC-1…39, 103/103 tests. The v0.2 end review is live as **gate G5-V0-2** in `npm run dev:self`.

```
npm run check          # codegen-drift + typecheck + lint + format + 103 tests
npx courtside doctor   # the same checks the header badge runs
```

### Documentation

| Doc                                                | Role                                            |
| -------------------------------------------------- | ----------------------------------------------- |
| [docs/prd.md](docs/prd.md)                         | The design doc (v1.1). Wins on behavior.        |
| [docs/framework-v2.md](docs/framework-v2.md)       | The process: phases, gates, cards, reports.     |
| [CLAUDE.md](CLAUDE.md)                             | Always-on rules (amended by DEC-20).            |
| [docs/courtside-guide.md](docs/courtside-guide.md) | The tool's manual; Ask Courtside indexes it.    |
| [spec/state.schema.json](spec/state.schema.json)   | The data contract (courtside/v0).               |
| [spec/fixtures/](spec/fixtures/)                   | Seed state + sample project the harness serves. |

### Plan state (the paper trail)

[plan/backlog.md](plan/backlog.md) (34 task cards) · [plan/decisions.md](plan/decisions.md)
(DEC-1…39) · [plan/gates/](plan/gates/) (a completion report per task) ·
[plan/tech-debt.md](plan/tech-debt.md) · [plan/adversarial-brief.md](plan/adversarial-brief.md) ·
[plan/session-log.md](plan/session-log.md)

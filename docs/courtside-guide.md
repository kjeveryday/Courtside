# Courtside guide

The dashboard's own manual. Ask Courtside indexes this file, so questions about
the tool itself ("what does the diamond mean?", "is approving safe?") get
answered from here — in every project, not just this repo.

## What Courtside is

A local-first dashboard for supervising a coding agent. The agent writes plan
files (`plan/state.json` and friends); Courtside watches them, renders the
board live, and records your decisions so the agent acts on them next session.
Nothing runs in the cloud; the server binds to your machine only.

## The board

- **Scorebug** — the top strip: what the agent is doing, its last narration,
  the active task, and the last test run.
- **Gate card** — finished work waiting on your call. Walk the verify steps
  (check each, or skip with a reason), then Approve, Reject, or Request
  changes. Reject and Request changes require a comment. Three rejections
  block a task until you discuss it.
- **Next up** — what the agent picks up once the gate clears.
- **Backlog** — every task, grouped by slice, finished work folded into a
  "done" line. Expand a task for its visual criterion, source link, commit,
  and the send-to-agent button.
- **Milestone / Ticker / Ledgers** — progress for the active slice; the event
  feed (newest first); open questions, tech debt, recent decisions, and how
  fresh the state file is.
- **The Huddle** — "since you last looked": tasks shipped, decisions that
  landed, gates waiting, questions still open. It opens by itself when you
  return after 30+ minutes away.

## Verified vs claimed

Every statement on the board carries a provenance badge. The check mark (✓,
verified) means it came from tooling Courtside ran or files it checked —
tests, lint, git, the decision log. The diamond (◇, claimed) means it is the
agent's own account (or an AI-written answer) and has not been checked. The
styling never mixes: nothing claimed is allowed to dress as verified.

## Deciding a gate

Your decision is written three ways at once: an append-only signed log (an
HMAC chain — tampering breaks it), a structured inbox file the agent reads
first next session, and a human-readable line in the decisions ledger. The
card settles to "logged — agent acts next session" because the loop is
asynchronous by design: you decide now, the agent acts when it next runs.

## Sending work to the agent

Backlog tasks and open questions carry a "send to agent" button, with room
for your added context. The directive is signed into the same inbox. If an
agent command is configured, Courtside launches it immediately and shows a
running chip (red with the exit code if it dies); if not, the directive
queues for the agent's next session. Connecting an agent is opt-in
(`COURTSIDE_AGENT_CMD`) — a click never spends agent usage silently.

## Ask Courtside

The ask panel answers questions about the project and the tool. It always
returns matches from the live board and your project files, each linking to
its source. With an agent command connected, it also writes a prose answer
from those matches — badged ◇ claimed, because prose is prose. Your question
and files stay on your machine; the only thing launched is your own local
agent command.

## Doctor and health

The header dot is the doctor: environment, agent setup, project files, and
security checks, re-run on every change. Click it for the full list with
fix-it lines. Deferred capabilities show as honest skips, never silence.

## Game tape

Gates can carry screenshots as evidence. Frames open full-size; a missing
file shows a dashed "missing" tile rather than pretending. Tape is evidence
for your eyes — it never checks a verify step for you.

## Security posture

Local only: the server binds 127.0.0.1 and every byte of state sits behind a
per-boot token. The decision log is HMAC-signed with a secret kept outside
git. No telemetry, no outbound calls. The demo project and your real project
keep separate runtime state — the demo's reset button cannot touch your real
decision chain.

## The demo

`npm run dev` serves a sample project (a small Godot tactics game mid-build)
so you can try the full loop safely: approve its gate, run "agent's next
session", watch the board update, reset and do it again. Your real project
runs the same way — point Courtside at its plan directory.

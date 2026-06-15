# GATE 5 — TASK-30 completion report

**Ask Courtside: live Q&A panel** · 2026-06-11 · DEC-36 · commit 8b9710d

## TL;DR

You asked whether there's a place to ask questions live and gather your
bearings. There wasn't — the Huddle is a fixed briefing, the legend is a
glossary. Now the header has **ask ▸**: type a question about the board, the
plan, the project docs, or Courtside itself.

## How it answers (and what it costs)

Two layers, by design:

1. **Bearings — always on, free, can't hallucinate.** Your question is matched
   against the live board (tasks, gates, open questions, debt, decisions, the
   agent's status), live facts the state file alone can't tell (a gate you
   already decided, directives sitting in the inbox, agent runs, doctor
   complaints), every markdown file in the project, and a new built-in manual
   ([docs/courtside-guide.md](../../docs/courtside-guide.md)) that covers the
   tool itself. Every match wears ✓ (it is real file/board content), names its
   source, and doc matches carry an **open ▸** that jumps to the section.
2. **Prose — opt-in, your own agent.** With an agent command connected
   (`COURTSIDE_AGENT_CMD`), the question, a board snapshot, and the matched
   sources go to your local agent, and its written answer renders above the
   sources wearing ◇ — prose is prose, even when it's helpful. Follow-ups
   carry the conversation. No agent connected → you still get the matches,
   nothing is launched, and nothing ever leaves your machine.

## Verify (browser)

1. `npm run dev:self`, click **ask ▸**, ask "what is waiting on me?" — instant
   ✓ matches from the live board.
2. Ask "what does the diamond badge mean?" — the manual matches; **open ▸**
   shows it at the section.
3. Ask "what tech debt do we have?" — the ledger items surface.
4. The ticker now carries "asked: …" rows (accent dot); the doctor panel has
   an honest "agent-cmd" line telling you whether prose answers are available
   and how to connect them.
5. Optional: `COURTSIDE_AGENT_CMD="claude" npm run dev:self` → the same
   questions now also return a written ◇ answer with the ✓ sources beneath.

## Tests

`npm run check` fully green: **85/85 tests, 23 files** (new: T39 bearings ×6 —
ids beat keywords, doc sections carry refs, stopwords ignored; T40 ask route
×5 — bearings without an agent, guide ref, stub-agent prose round-trip, guide
served in any project). Live smoke 6/6 on the self view, including proof the
agent prompt carries the board + sources.

## Debt

D-4 logged: App.tsx (222) and http.ts (234) drifted past the ≤200-line target
as panels and routes accumulated — split a panel dock / route table next time
either is touched.

## Next (your confirm)

Once you've tried the panel, #2 from your message: the setup wizard. Plan is
in the report-back; it builds on this task's pieces (doctor checks, the
guide, the config-gated agent).

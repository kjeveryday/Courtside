# GATE 5 — TASK-33 completion report

**Debt paydown: persisted agent runs; routes split; Linux note** · 2026-06-11

## TL;DR

"Finish up the build" starts with the IOU ledger. All three open debts are
closed or honestly downgraded:

- **D-3 — resolved.** A failed agent launch used to be forgotten the moment
  the server restarted: its red chip silently reverted to "in agent inbox."
  Finished runs (exited/failed) now persist to the project's runtime db and
  reload on boot. Running ones are deliberately _not_ stored — a "running"
  chip from a dead server would be a lie. T45 proves it: dispatch through a
  stub agent that exits 1, restart the server, the failure is still on the
  board with its exit code.
- **D-4 — resolved.** http.ts had grown to ~300 lines. It's now context +
  shared helpers (77 lines) with the API surface in its own routes.ts. The
  routes file and App.tsx each stay whole — one coherent responsibility each,
  which is what rule 12's "never fragment coherence" is for.
- **D-2 — downgraded.** The original worry (recursive fs.watch unreliable on
  Linux) predates our Node ≥24 floor: Node documents recursive watch support
  on Linux since v19.1. Residual, named in the ledger: one smoke test on an
  actual Linux box before any OSS release — that can't be verified from this
  machine, so it isn't claimed.

## Verify (browser)

Set an agent command to something that fails (`COURTSIDE_AGENT_CMD="node -e x"`
works), `npm run dev`, send TASK-13 to the agent, watch the red chip appear —
then restart the server and reload: the chip is still red, with the exit code.

## Tests

`npm run check` fully green: **103/103 tests, 26 files** (new: T45 run
persistence — round-trip, running-never-stored, restart survival through a
real second server boot).

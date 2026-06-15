# GATE 5 — TASK-28 completion report

**Adversarial review: find and fix the small lies** · 2026-06-11 · DEC-34

## TL;DR

A fresh-eyes reviewer (standing brief: [adversarial-brief.md](../adversarial-brief.md))
hunted the dashboard for labels that lie, controls that dead-end, and claims
dressed as facts. It returned **24 findings**. Every one was verified against
source before acting; all 24 were real; all 24 are fixed, in four commits.

## The two that mattered most

1. **The demo could erase your real decisions.** Both views shared one
   `.courtside/` runtime — the demo's "reset ↺" deleted the same
   `decision-log.ndjson` that holds your signed G5-V0-1 approval (this had
   already happened once: your approval sits at seq 1 because earlier demo
   decisions were wiped from the shared chain). Runtime state now lives next to
   the plan it belongs to; the demo resets only itself. The smoke test asserts
   your real chain survives a full demo cycle untouched.
2. **One bad file could blank the whole board.** A malformed gate payload threw
   inside `/api/state` → 500 → full-screen refusal with no culprit named. It now
   degrades to a dashed notice on that one gate, naming the unreadable file.

## Also fixed (grouped)

- **Dead links:** every self-view source ref pointed under `plan/`, which the
  doc route refused — all dead. `plan/*.md` now serves (still confined,
  markdown-only). Anchors use GitHub-style slugs, `#b1`-style prefixes match,
  and a missed anchor says "section not found" instead of failing silently.
  The demo fixture gained its missing `framework-v2.md`.
- **Honesty:** the Huddle no longer counts a gate you already decided as
  "waiting on you"; agent self-reports show ◇ claimed everywhere (huddle
  included); rejections stop settling in green; "itching" only when old;
  "Recent decisions" says what the count is; the one-day sparkline says so;
  tape counts only frames that exist; doctor tells the truth about your git
  remote and names its lint warnings.
- **Visibility:** meta items and ticker rows with an `artifactRef` open the
  evidence behind the ✓ (new confined `/api/artifact` route, T37); the
  server's own observed events (dispatches, agent runs, refusals) now appear
  in the ticker; a failed agent launch shows a red chip with exit code + log
  instead of dying silently (and broadcasts immediately).
- **Smalls:** stale decision-error banner clears on success; empty ledger rows
  stop pretending to expand; dangling "logic-only →" fixed; collapsing
  "skip…" withdraws the typed reason; legend covers every dot kind.

## Verify (browser)

1. `npm run dev`, open the token link. On the gate card, click **14/14 GUT
   tests** in the meta row — the actual test log opens. Ticker rows show
   **evidence ▸** links.
2. Expander reads **report + tape (1, 1 missing) ▸** — it counts only what
   exists.
3. Approve the gate, open **The Huddle ▸** — no "waiting on you" for the gate
   you just decided; the agent line wears ◇, not ✓.
4. Click **reset ↺**, then check this repo's `.courtside/decision-log.ndjson`
   — your real chain is untouched (the demo now has its own).
5. `npm run dev:self` — click any source ref (specs, backlog): the doc opens
   at the right section.

## Tests

`npm run check` green: codegen ✓ · typecheck ✓ · eslint ✓ · prettier ✓ ·
**71/71 tests, 20 files** (new: T36 anchors ×5, T37 artifacts ×2, malformed
payload, huddle decided/provenance ×2, plan-docs serve). Live smoke: 18/18
across both views, including the chain-intact assertion.

## Debt

D-3 logged: agent-run records are in-memory; a server restart forgets a failed
launch's red chip. Persist to the runtime db later.

# Slice spec — S5 "the-gate"

- **Status:** ✅ auto-approved (GATE 2, autonomous mode DEC-20) · 2026-06-10
- **Features:** F6 gate inbox · F7 verify mode · F19 rejection · signed async decision loop (PRD §5, R7) — the ship-criterion core.

**Open questions consumed (agent-decided, DEC-24):** **Q-6 → A**: no PIN/extra
friction — F7's checklist gating _is_ the anti-accident mechanism. **Q-7 → A**:
hybrid payload — structured `verifySteps` stay in state.json; the gate payload file
(`plan/gates/<id>.json`, `courtside/gate-payload-v0`) adds `title/sourceRef/tldr/
meta[]/reportMd`, where each `meta[]` item carries its own provenance (delta (a):
"self-audit: 0 findings" ships **claimed** in the fixture, exactly the PRD example).

## Behaviors

- **B1 (TASK-13, LOGIC-ONLY → TASK-15):** `src/core/signing.ts` — HMAC-SHA256
  chain (`mac = HMAC(secret, seq|ts|payload|prevMac)`), secret created at first run
  in `.courtside/secret`; `verifyChain` detects any edit/deletion/reorder.
  `src/core/decisions.ts` — one decision write = (1) append to the chained
  `.courtside/decision-log.ndjson`, (2) `plan/decisions-inbox/<gateId>.json`
  (structured answers-as-data, carries its mac), (3) a line appended to
  `plan/decisions.md`. `src/core/lint.ts` — referential integrity (deps /
  surfacesAt / blocking / gate.taskId / currentTask resolve; payloadRef & tape
  files exist) + decision-log chain verification. Tests T21 (sign/verify/tamper),
  T22 (writer artifacts + mac), T23 (lint: clean fixture passes; seeded breakages
  caught).
- **B2 (TASK-14, LOGIC-ONLY → TASK-15; 2 logic-only in a row, within budget):**
  API — `GET /api/gates` (state gates joined with payload files + any inbox
  decision), `POST /api/decisions` `{gateId, decision: approve|reject|
request_changes, comment?, steps:[{text, checked, skippedReason?}]}`.
  **Server-enforced rules, not just UI:** reject/request_changes require a
  non-empty comment (F19/F6); approve requires every verify step checked or
  skipped-with-reason (F7); deciding an already-decided gate → 409. Decisions
  broadcast over WS. T24 integration: 400/400/200/409 paths + files on disk.
- **B3 (TASK-15):** the signature Gate card (mock pattern + async deltas): striped
  band, GATE-id chip, title, source line, TL;DR (◇ claimed), meta row with
  **per-item provenance badges**, tape filmstrip placeholder note (S7), the verify
  checklist (checkbox per step; inline "skip — why?" reason field), actions
  Approve (locked until complete) / Reject with comment / Request changes.
  After deciding: **"decision logged · {decision} · agent acts next session"**
  (delta (b)) and the card settles; **Next up** (todo tasks of the slice) sits
  dimmed below until an approve decision. Rejection counter chip from
  `task.rejections`(+1 live after a reject decision); display-derived `revise`;
  at 3+ the card shows the auto-block discussion note (F19).
- **B4 (TASK-16):** the cycle demo. `scripts/agent-session.mjs` simulates the
  consuming agent's next session against the fixture: consume inbox decisions →
  update `state.json` (approve: gate approved, task done, agent moves to next task
  with fresh narration + events; reject: task → revise, rejections+1, agent
  narrates the rework) → move consumed inbox files to `decisions-inbox/consumed/`
  (harness convention). Server exposes `POST /api/dev/agent-session` **only when
  serving the fixture project** (harness flag in `/api/state` payload); UI shows a
  clearly-labeled "harness: simulate next agent session" footer button. The full
  async cycle then happens browser-only (ship criterion). T25: approve and reject
  simulations against temp dirs.

## Visual criterion (slice)

Open the token URL: the amber-striped GATE 5 card shows TL;DR + meta row where
"14/14 GUT tests" wears ✓ verified and "self-audit: 0 findings" wears ◇
agent-reported; Approve is disabled until all 4 steps are checked/skipped;
approving flips the card to "decision logged · agent acts next session," un-dims
Next up, and the ledgers' decision count ticks up live; clicking the harness
button makes the page update itself — agent "working," TASK-12 done, new
narration in the ticker. Rejecting (with comment) shows revise + counter.

**Out of scope:** tape rendering (S7), huddle (S7), doctor (S6), MCP anything (M2).
**New deps:** none.

---

GATES 3+4 (auto, DEC-20): TASK-13 → TASK-14 → TASK-15 → TASK-16.

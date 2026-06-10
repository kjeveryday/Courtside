# Slice spec — S7 "tape-and-huddle"

- **Status:** ✅ auto-approved (GATE 2, autonomous mode DEC-20) · 2026-06-10
- **Features:** F17 Game Tape **viewer** · F20 Tier 1 deterministic Huddle (last v0.1 features)

## Behaviors

- **B1 (TASK-19, tape):** server route `GET /api/tape/<path>` serves files strictly
  under `<planDir>/tape/` (path-traversal guarded, token-gated). `src/server/tape.ts`
  `resolveTape(planDir, frames)` returns per-frame `{ path, exists, mtime?, size? }`
  (T28). Gate card grows a **filmstrip**: existing frames render as images with a
  ✓ verified chip + mtime (file facts Courtside confirmed itself — §5); missing
  frames render the designed **"missing — unverifiable"** tile (DEC-4; the fixture
  ships frame-001 and deliberately lacks frame-002). **R8 hard rule:** tape never
  auto-checks verify steps — the filmstrip is display-only evidence.
- **B2 (TASK-20, huddle):** `src/core/huddle.ts` builds the Tier-1 briefing from
  deterministic facts only (T29): tasks done since last seen, gates waiting (and
  for how long), open questions (age, what they block), agent state + since,
  decisions made since. Last-seen lives in SQLite kv: on each authenticated
  `/api/state` the server bumps `last_seen`; `prev_seen` rotates only when the gap
  exceeds 30 min (DEC-26 — reloads don't wipe the diff window). `GET /api/huddle`
  returns `{ sinceLabel, facts: [{text, kind}] }`; UI: **"The Huddle"** button in
  the header opens a panel of facts, every line ✓ verified (zero AI, zero cost —
  Tier 2 is M2). Empty diff → "you're caught up — nothing happened since you last
  looked."

## Visual criterion (slice)

Gate card shows the filmstrip: one real DebugBattle-ish frame (hover/caption shows
mtime + verified chip) and one "missing — unverifiable" tile for frame-002. The
Huddle button yields a briefing like: _"Since you last looked (N min ago): 0 tasks
shipped · 1 gate waiting on you (G5-TASK-12, posted …) · Q-7 open 6+ days, blocking
TASK-15 · agent parked since 7:42 PM."_ After approving + simulating the agent
session, the next Huddle reflects it (1 task shipped, no gates waiting).

**Out of scope:** capture utility (consuming project's harness task), SHA-burn
verification vs git (M2 — mtime + existence only in v0.1), Tier-2 narrative (M2).
**New deps:** none.

---

GATES 3+4 (auto, DEC-20): TASK-19 → TASK-20.

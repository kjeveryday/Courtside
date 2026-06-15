# GATE 5 · G5-TASK-14 — ✅ auto-approved (autonomous mode, DEC-20)

## TASK-14 — done (2026-06-10) · LOGIC-ONLY → surfaces at TASK-15 (2nd of 2, at budget)

**TL;DR:** The decision API is live and the rules are server-enforced, not UI
politeness: reject/request-changes without a comment → 400 (F19); approve without
every verify step checked-or-skipped-with-reason → 400 (F7); unknown gate → 404;
already-decided → 409. A valid decision writes the chained log + signed inbox file

- decisions.md line and reaches the UI on the next broadcast. `/api/state` now
  carries joined gate views (state gate + payload file + any decision) and a
  harness-mode flag.

**Verify:** `npm test` → T24 in the 42/42 run (asserts every status path and the
on-disk artifacts). **Deviations vs spec B2:** no separate `GET /api/gates` —
gates ride inside the `/api/state` payload (fewer round trips, single trust path);
recorded here. **Debt:** none. **Next:** TASK-15 — the Gate card UI.

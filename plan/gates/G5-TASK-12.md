# GATE 5 · G5-TASK-12 — ✅ auto-approved (autonomous mode, DEC-20) — S4 SHIPPED

## TASK-12 — done (2026-06-10)

**TL;DR:** The dashboard is live. The server watches the fixture project's plan
dir; edits revalidate and push over an authenticated WebSocket; the page applies
them without reload and shows a live-dot in the header (green live / muted
connecting / red lost-retrying). Every observed change lands in SQLite as a
verified event. Broken JSON mid-edit flips the live refusal view; fixing recovers.

**Verify:** `npm run dev` → open the token URL → edit
`spec/fixtures/sample-project/plan/state.json` narration → page text changes within
~a second, no reload; break the JSON → live refusal; fix → recovers; header dot
stays green throughout.

**Evidence:** T18 (debounce), T19 (sqlite roundtrip), T20 (real ws client received
a broadcast after a file change; tokenless upgrade refused) — 29/29 green. Live
smoke in session: file edit → sqlite row `state_change · verified · "state
revalidated ok (5 tasks)"` → api 200.

**Deviations:** none vs spec B3. **Debt:** none new (D-2 stands).
**S4 slice criterion met.** **Next:** S5 "the-gate" — decisions, signing, the
async loop (ship-criterion core).

# GATE 5 · G5-TASK-13 — ✅ auto-approved (autonomous mode, DEC-20)

## TASK-13 — done (2026-06-10) · LOGIC-ONLY → surfaces at TASK-15

**TL;DR:** The trust machinery exists. Decisions are HMAC-chained (edit, delete, or
reorder any entry and verification names the broken seq); one decision write
produces the chained log + the signed decisions-inbox file the agent reads next
session + a human-readable decisions.md line. `courtside lint` now checks what the
schema can't: referential integrity, payload/tape file existence, and chain
integrity — and it validated the real fixture, downgrading dangling _deps_ to
warnings (aged-out tasks are legitimate in a windowed list) while keeping missing
payloads/tasks as failures.

**Verify:** `npm test` → T21/T22/T23 in the 38/38 run. **Evidence:** tamper tests
prove edit/removal/reorder/wrong-secret all break the chain; T22 proves the three
artifacts agree (inbox mac == chain mac); T23 runs against the actual fixture.
**Deviations:** dep-severity judgment (warn not fail) — recorded here + in code
comments. **Debt:** none. **Next:** TASK-14 gates/decisions API.

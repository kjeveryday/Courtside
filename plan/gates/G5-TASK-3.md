# GATE 5 · G5-TASK-3 — ✅ approved 2026-06-10 (DEC-16) — S1 SHIPPED

Human verified the two-state demo in the browser. Per-feature audit (framework §8):
all report claims trace to shown output (check green, curl smoke test); no
undisclosed changes in the diff; 0 findings. _(Agent-performed audit; the browser
verify is the human-verified half.)_

Posted 2026-06-10 · task: [TASK-3](../backlog.md) · commit `de062d4` ·
[diff on GitHub](https://github.com/kjeveryday/Courtside/commit/de062d4) ·
**approving this completes slice S1 (walking-skeleton = framework Phase 1.5)**

---

## TASK-3 — done, awaiting review

**TL;DR:** The harness now does its real job. The page fetches the sample fixture,
runs it through the validated contract pipeline, and renders the live status — agent
state, narration, current task — straight from the data. Feed it a broken fixture and
it refuses: a red error view naming exactly what's wrong, with zero state rendered.
This is TASK-2's invisible logic made visible, and it finishes S1.

**Verify in 60 seconds (browser — the two-state demo):**

1. Terminal: `cd ~/Desktop/Courtside && npm run dev` → open `http://localhost:4310`.
2. **Green path — you should see:** "Courtside" header; a green
   **fixture validates ✓ courtside/v0** line; a small pill chip
   **phase 5 · battle-core**; an "AGENT" card reading **parked at gate** ·
   _since 7:42 PM_, the italic narration _"Wired range overlay into DebugBattle; all
   14 GUT tests green. Next: your review."_, and **TASK-12** in mono. Every one of
   those values comes from the fetched file.
3. **Break it:** open `spec/fixtures/state.sample.json` in any editor, change
   `"state": "parked_at_gate"` to `"state": "napping"`, save, reload the browser.
4. **Red path — you should see:** **fixture invalid ✗ — refusing to render state**,
   a red box listing `/agent/state — must be equal to one of the allowed values`,
   and none of the green-path data anywhere on the page.
5. **Restore:** change it back to `"parked_at_gate"` (or `git checkout -- spec/`),
   save, reload → green returns. `Ctrl-C` stops the server.

**Why it was built this way:** runtime fetch + validation (not a build-time import)
so the harness exercises the same load→validate→render-or-refuse path the real
server will own from S4 (spec §B4.1); the fixture is served from its single source
location via Vite's publicDir — no copies to drift (§B4.2); the refusal view gets
only the error list, making partial rendering of untrusted state structurally
impossible (PRD §5).

**Test results (real output):** full `npm run check` green — codegen drift OK,
typecheck/lint/format clean, vitest **6/6**. Smoke-tested live:
`/fixtures/state.sample.json` serves the fixture and `/` serves the page (curl,
output in session). The two-state rendering itself is yours to verify — that is
this gate.

**Honest deviations:** none against spec §B4. (One addition: a brief "loading
fixture…" string during fetch — unavoidable intermediate state, renders no data.)

**What's next:** S1 complete on your approval → Phase 2 spec for **S2 "scorebug"**
(design tokens + vendored fonts, F1 status board, F4 ticker, and the
`Verified/Claimed` provenance types with their F18 badges), stopping at GATE 2.

**Refactoring opportunities:** none yet — App.tsx is 109 lines; S2 will split views
into components when the second view arrives, not before.

**Tech debt incurred:** none.

**Open questions raised:** none.

---

**Decision (human, via chat):** approve / reject-with-comment. Approval = TASK-3
done **and S1 shipped**; next stop is GATE 2 for the S2 spec.

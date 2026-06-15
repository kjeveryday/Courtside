# Slice spec — S6 "pre-game"

- **Status:** ✅ auto-approved (GATE 2, autonomous mode DEC-20) · 2026-06-10
- **Features:** F0 preflight + `courtside doctor` · health badge · `courtside lint` CLI (PRD M0; ship criterion #2)

## Behaviors

- **B1 (TASK-17):** `src/core/doctor.ts` — check functions returning
  `{id, category, status: pass|warn|fail|skip, detail, fixit?}`:
  _Environment:_ node ≥ engines (24); git repo present; git remote configured
  (warn-only — full GitHub connect is F16/M2, so auth/push dry-run checks are
  **deliberately deferred**, recorded here). _Agent:_ CLAUDE.md present and
  carrying the framework marker; MCP handshake **skip — M2**. _Project:_ plan dir
  resolves; state validates; `lintPlan` clean (fail findings → fail);
  framework doc present; oversized docs warned (>300 KB → context-window warning).
  _Engine/Harness:_ plugin interface (`EnginePlugin`) with **none configured** →
  skip with explanation (engine adapters are consuming-project/OSS territory —
  PRD F0's "implemented as a plugin"). _Security:_ runtime dir + secret presence.
  CLI: `bin/courtside.mjs` (package.json `bin`, DEC-5 repo-local) → `npx courtside
doctor` (table + exit 1 on fail) · `npx courtside lint` (findings + exit code) ·
  `npx courtside dev` (delegates to the harness boot). Tests T26 (doctor against
  this repo + fixture: zero fails), T27 (node-version boundary logic).
  Terminal-observable by design; the _visual_ checkpoint is TASK-18's badge.
- **B2 (TASK-18):** `GET /api/doctor` runs the same checks server-side (verified
  provenance — F18); header **health badge** = worst status (ok dot "doctor: all
  green" / accent "N warnings" / risk "failing — click"), click toggles the
  preflight panel: checks grouped by category with fix-it lines + re-run button.
  Doctor re-fetches on every live state push (decays mid-session per PRD F0).

## Visual criterion (slice)

Token URL → header shows a green dot "doctor: all green · N warnings"; click →
preflight panel lists every check with detail/fixit (MCP + engine rows say
_skipped_ with honest reasons); break the fixture's state.json → live refusal view
AND the badge flips red on the next push; fix → green returns. Terminal:
`npx courtside doctor` prints the same checks; exit code 0.

**Out of scope:** MCP handshake (M2), GitHub auth/push dry-run (M2/F16), engine
plugins beyond the interface (OSS/M4), auto-fixes (only safe ones exist v0.1: the
scaffold itself; everything else is fix-it text). **New deps:** none.

---

GATES 3+4 (auto, DEC-20): TASK-17 → TASK-18.

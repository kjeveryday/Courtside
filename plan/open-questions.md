# Open Questions

Logged per CLAUDE.md rule 4: when the spec is silent, options + a labeled
recommendation, then stop — never invent. (PRD-internal numbering OQ1–OQ5 belongs to
the PRD; this ledger uses Q-n.)

| ID | Question | Status | Raised | Resolution |
|---|---|---|---|---|
| Q-1 | Normalize doc/spec paths? | **answered** → A | Phase 0 | DEC-2 — moved 2026-06-10 |
| Q-2 | When to `git init`? | **answered** → A | Phase 0 | DEC-3 — init'd 2026-06-10; remote URL still pending |
| Q-3 | Missing fixture companion files | **answered** → A | Phase 0 | DEC-4 — placeholders + missing-state, lands with harness tasks |
| Q-4 | "`npx courtside`" in v0.1 ship criteria | **answered** → A | Phase 0 | DEC-5 — local CLI bin; publishing stays M4 |
| Q-5 | Fixture timestamps drift | **answered** → A | Phase 0 | DEC-6 — real clock, drift accepted |
| Q-6 | (= PRD OQ1) Approval friction: PIN/keypress? | **open** — leaning A per GATE-0 delegation; confirm at Phase 2 gate (gate slice spec) | PRD v1.1 | — |
| Q-7 | (= PRD OQ4) Completion report: structured vs freeform | **open** — leaning A per GATE-0 delegation; confirm at Phase 2 gate (verify slice spec) | PRD v1.1 | — |

---

## Q-1 — Normalize doc/spec paths?

Docs live in `Courside Docs/` and `Cousrside Specs/` (note typos); CLAUDE.md, the
kickoff prompt, and this plan all reference `docs/` and `spec/`:

| Today | Canonical |
|---|---|
| `Courside Docs/courtside-prd.md` | `docs/prd.md` |
| `Courside Docs/framework-v2.md` | `docs/framework-v2.md` |
| `Courside Docs/courtside-mock.html` | `docs/mock.html` |
| `Cousrside Specs/state.schema.json` | `spec/state.schema.json` |
| `Cousrside Specs/state.sample.json` | `spec/fixtures/state.sample.json` |

- **A — Move/rename to canonical paths at scaffold (RECOMMENDED).** Matches every
  existing reference; folder typos disappear; done once, before any code points at them.
- **B — Keep current paths, edit CLAUDE.md to match.** Preserves your folders but bakes
  typos into the rules file and diverges from the PRD's own `docs/prd.md` self-reference.
- **C — Copy instead of move.** Two copies of the truth will drift. Not recommended.

## Q-2 — When to `git init`?

Not a git repo yet; rule 20 requires commit-per-task and framework gates reference
commits. Init is safe and reversible, but it's a repo-level change you should call.

- **A — `git init` as the first scaffold step after GATE 0 (RECOMMENDED),** with a
  `.gitignore` (node_modules, .DS_Store, db files) and an initial commit of docs + plan.
  Every subsequent task lands as its own commit per rule 20.
- **B — You init it yourself** (e.g., you want to choose host/visibility first — though
  no remote is needed for v0.1; GitHub connect is M2).

## Q-3 — Fixture references companion files that don't exist

`state.sample.json` points at two tape frames, one artifact log, and one
decisions-inbox file; none exist. The Game Tape viewer (F17) and verified-event
artifacts (F18) need *something* to render in the harness, and the PRD also requires
detecting stale/missing tape (R8).

- **A — Both: add minimal placeholder fixtures AND build graceful missing-file states
  (RECOMMENDED).** Two small stamped placeholder PNGs, a short fake GUT log, one signed
  decision JSON — so the happy path renders — plus an explicit "missing/unverifiable"
  state, which the PRD demands anyway. The fixture should exercise both.
- **B — Placeholders only.** Hides the missing-file state the PRD requires us to design.
- **C — Missing-state only.** The viewer's happy path would be undemonstrable in the
  harness, violating the visual-criterion rule.

## Q-4 — "`npx courtside`" appears in v0.1 ship criteria, but npx packaging (F13) is M4

- **A — Local CLI via the repo's own bin (RECOMMENDED).** `npx courtside` (or
  `npm run ...`) works *inside a clone* without publishing to npm; publishing +
  quickstart docs remain M4 (F13). Satisfies the ship criterion's spirit: clone →
  all-green doctor in <15 min.
- **B — Publish to npm in v0.1.** Pulls M4 packaging work into the Lite cut — scope
  creep by rule 7 unless you explicitly want it.

## Q-5 — Fixture timestamps drift (cosmetic)

Fixture dates are written as 2026-06-10; age indicators ("question open 6 days")
computed against the real clock will grow stale-looking over time.

- **A — Compute ages from the real clock; accept drift (RECOMMENDED).** Product code
  stays honest with zero special cases. If the demo ever looks ancient, refresh the
  fixture's dates in one commit (possible later convenience: a tiny re-dating script).
- **B — Pin "now" to `generatedAt` when serving the fixture.** Stable demo, but the
  harness would run a code path (fake clock) that production doesn't — mild dishonesty.

## Q-6 — (= PRD OQ1) Should gate approval require extra friction (PIN/keypress)?

- **A — No extra friction in v0.1 (RECOMMENDED).** F7 already gates the Approve button
  behind completing every verify step (or skip-with-reason) — that *is* the
  anti-accident mechanism, and token auth covers "who." Revisit with real usage data.
- **B — Typed confirmation phrase on Approve.** Cheap, explicit, slightly annoying.
- **C — Local PIN.** Most friction; protects against shared-screen misclicks, which
  single-user local-first mostly doesn't have.

## Q-7 — (= PRD OQ4) Completion report: structured fields vs freeform markdown?

Affects how rich Verify Mode (F7) can be. Note the schema already structures the part
v0.1 *needs*: `gates[].verifySteps[]` with optional `criterionRef`.

- **A — Hybrid (RECOMMENDED):** structured `verifySteps` (already in the contract) +
  the report body as freeform markdown in the gate payload file, rendered as-is.
  v0.1 builds nothing new; richer structure can come later without breaking v0 data.
- **B — Fully structured report schema now.** More to design before Phase 2 can finish;
  risks hand-drifting a second schema (rule 13 territory).
- **C — Fully freeform.** Verify Mode would have to parse prose for steps — fragile.

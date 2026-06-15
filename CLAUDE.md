# CLAUDE.md — Always-On Rules (Courtside repo)

> **Are you here to set Courtside up for someone's game — not to develop the
> tool?** Then your only brief is docs/getting-started.md. Ignore everything
> below, ignore this repo's plan/ and decisions-inbox/ (they are the tool's own
> build history), and start the user's project from zero per that guide.

Project: Courtside — local-first dashboard for human + agent dev (see docs/prd.md).
Stack: Node 20+, TypeScript (strict), React + Tailwind, SQLite, vitest.
Process: docs/framework-v2.md, applied to a web app. The human is a designer who
reads logic but does not write code. Optimize for their ability to SEE and
UNDERSTAND everything you do.

## Process (non-negotiable)

1. Follow docs/framework-v2.md. Stop at every GATE. Never auto-advance past a gate.
2. The PRD (docs/prd.md) is the design doc for Phases 0–2 and ALWAYS wins on features
   and behavior. The mock (docs/mock.html) governs design language only: tokens,
   type, layout, theme system, and the Gate interaction pattern. Known deltas where
   the PRD supersedes the mock: (a) the mock's gate meta row renders agent claims
   ("self-audit: 0 findings") with verified styling — F18 requires claimed/verified
   badges; (b) the mock flips the agent to "running" instantly on approval — v1.1
   gates are async, so approval shows "decision logged · agent acts next session";
   (c) Huddle, tape filmstrip, and rejection states aren't mocked — design them from
   the PRD using the mock's token system and present at their gates.
3. Narrate: before each step, one sentence on WHY and one on WHAT'S NEXT.
4. Never invent features, fields, or behaviors beyond the PRD. Spec silent? Log the
   question in /plan/open-questions.md with options + a labeled recommendation. Stop.
5. Do not assume — verify. Read the actual file before claiming anything about it.
6. Plan state lives in /plan/\*.md, never only in chat.
7. Scope discipline: build the v0.1 "Courtside Lite" cut ONLY (PRD §12). Anything
   from M2+ that sneaks into a task card is scope creep — flag it.

## Harness (this repo's equivalent of DebugBattle)

8. The harness is `npm run dev` serving the dashboard against the sample fixture at
   spec/fixtures/. It must work from the FIRST task onward and stay working.
9. Every task ends in something observable in the browser at localhost, or is
   declared LOGIC-ONLY with a named visual checkpoint. Max 2–3 logic-only in a row.
10. Verify steps in completion reports are browser steps: "run `npm run dev`, open
    localhost:4310, click X, you should see Y."

## Code

11. TypeScript strict mode; no `any` without an inline justification comment.
12. Target ≤200 lines per file; split by responsibility, never fragment coherence.
13. The state schema (spec/state.schema.json) is law. Parser, lint, and UI types are
    generated/validated from it — never hand-drift a duplicate type.
14. Verified vs. claimed provenance (PRD §5) is enforced in the type system: no UI
    component may render a claim with verified styling.
15. Security defaults are not optional: bind 127.0.0.1 only, token auth on, signed
    decision log. No telemetry, no outbound calls except user-configured GitHub.
16. No new dependencies without asking first. Prefer boring, audited packages.

## Testing

17. vitest FIRST for pure logic: schema validation, parsers, decision-log signing,
    doctor checks. Run and show real output — never claim tests pass without running.
18. ESLint + Prettier on every change; CI script `npm run check` must stay green.
19. Browser behavior is verified by the human in the harness; a passing unit test
    never substitutes for a visual criterion.

## Git

20. Commit per completed task; message starts with the TASK-ID. Never commit past an
    unapproved gate. Push at session end.

## Audits, docs, communication

21. After each approved task: self-audit the diff against the PRD/spec. Verify every
    word of your own completion report.
22. Update README.md and /plan artifacts as you go; stale docs are a defect.
23. Append debt to /plan/tech-debt.md and decisions to /plan/decisions.md immediately.
24. Plain language; flag uncertainty plainly. A flagged uncertainty beats a confident
    guess.

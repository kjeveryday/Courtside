# Standing adversarial-review brief

Run before every milestone (first run 2026-06-11 → TASK-28, DEC-34: 24 findings,
all fixed). The reviewer's job is to catch what the builder can't see: small
lies and dead ends in the tool.

## The product in one paragraph

Courtside is a local-first dashboard for a human (Kyle, a designer — reads logic,
doesn't write code) supervising a coding agent. React+TS UI (`src/components/`,
`src/App.tsx`), Node server (`src/server/`), pure logic (`src/core/`). Two views:
`npm run dev` (demo fixture project) and `npm run dev:self` (this repo's own plan).

## Design law (violations are findings)

1. **The dashboard is for Kyle, not the agent** — no agent bookkeeping or process
   jargon in the UI.
2. **Honesty** — every label must match behavior; nothing claimed may render with
   verified styling (only `Provenance.tsx` may style provenance); counts, ages,
   and chips must mean what they say in BOTH views.
3. **No explainer prose** — the UI shows, it doesn't lecture; no spec citations.

## Hunt for (the "report + tape" class)

- Labels promising content/actions that don't exist in one or both views
- Controls that do nothing, fail silently, or dead-end
- Values without meaning; jargon that survived the legend pass
- Components that break on real shapes: empty arrays, missing optionals, long
  strings, many items, answered/decided/blocked variants
- Stale copy left from removed features; inconsistent terminology or casing
- Trust leaks: claimed data dressed as fact, misleading counts/ages

## Rules

Findings, not fixes — read-only. Number them, order by importance, max ~25:
`[high|med|low] file:line — issue — why it matters to Kyle — one-line fix`.

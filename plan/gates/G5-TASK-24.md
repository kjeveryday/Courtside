# GATE 5 · G5-TASK-24 — awaiting Kyle's pass (DEC-30)

## TASK-24 — done (2026-06-10) · source-doc links + legend

**TL;DR:** Every source ref is now a link — gate card, next-up rows, backlog
drilldown — opening an in-app viewer that scrolls to and highlights the exact
section the ref names. The demo project now has a real gdd.md (sections matching
every fixture ref) so links resolve instead of dying. A "?" in the header opens
the legend: provenance glyphs, risk levels, task statuses, gate ids, ticker dot
colors, age colors — each explained once. Risk/status chips and dots also carry
hover tooltips.

**Verify:** rebuild + reload (`npm run dev`, new token link) → click `gdd.md` on
a Next-up row → viewer opens with "Movement" highlighted; click the gate card's
`gdd.md#movement-ranges` → same doc, different section; "?" → legend.

**Evidence:** T34 (doc route confinement: .md under project root only; traversal /
plan internals / hidden / node_modules all refused) — 59/59; live smoke: gdd.md
200 with the section present, traversal 404, plan/decisions.md 404. App split
(Dashboard.tsx extracted) keeps every file under 200 lines.

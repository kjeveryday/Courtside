# Decisions Log

Appended immediately when decided (CLAUDE.md rule 23). Format:
`DEC-n · date · decision · decided by · context`

| ID | Date | Decision | By | Context |
|---|---|---|---|---|
| DEC-1 | 2026-06-10 | **GATE 0 approved** — corpus complete, v0.1 "Courtside Lite" scope confirmed as inventoried | human | GATE 0; discrepancy handling delegated to agent judgment ("I trust your judgement… make changes as needed") |
| DEC-2 | 2026-06-10 | Q-1 → **A**: docs/specs moved to canonical paths (`docs/`, `spec/`, `spec/fixtures/`); typo'd folders removed | human (delegated) | GATE 0 |
| DEC-3 | 2026-06-10 | Q-2 → **A**: `git init` (branch `main`) at GATE 0 close-out; commit per task from here on. Remote URL pending from human; push resumes per rule 20 once provided | human (delegated) | GATE 0 |
| DEC-4 | 2026-06-10 | Q-3 → **A**: fixture gets minimal placeholder companion files AND the UI designs an explicit missing/unverifiable state; fixture will exercise both | human (delegated) | GATE 0; lands via Phase 1.5/slice task cards |
| DEC-5 | 2026-06-10 | Q-4 → **A**: "`npx courtside`" in ship criteria = repo-local CLI bin; npm publishing stays M4 (F13) | human (delegated) | GATE 0 |
| DEC-6 | 2026-06-10 | Q-5 → **A**: ages computed from the real clock; fixture date drift accepted (optional re-dating script later) | human (delegated) | GATE 0 |
| DEC-7 | 2026-06-10 | Repo-local git identity set to placeholder `Kyle Johnson <kyle@courtside.local>` (no global identity on machine); human confirmed **keep for now** (commits won't link to a GitHub account until changed) | human | GATE 1 Q&A |
| DEC-8 | 2026-06-10 | **GATE 1 approved** — component map, slices S1–S7 in proposed order, S1 walking-skeleton first **including its dependency list** (rule 16 satisfied for S1) | human | GATE 1 |
| DEC-9 | 2026-06-10 | Git remote provided and wired: `https://github.com/kjeveryday/Courtside` — push at session end per rule 20 | human | GATE 1 Q&A |
| DEC-10 | 2026-06-10 | **GATE 2 approved** — S1 walking-skeleton spec confirmed as written (B1–B5, refusal state, T1–T6) | human | GATE 2 |

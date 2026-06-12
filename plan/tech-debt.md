# Tech Debt Ledger

Appended immediately when incurred (CLAUDE.md rule 23). Format:
`D-n · date · what we owe · why we took it · task that incurred it`

| ID  | Date       | What we owe                                                                                                                                                                                                                                                                                               | Incurred by |
| --- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D-1 | 2026-06-10 | ~~vitest `passWithNoTests` — empty suite passed.~~ **RESOLVED at TASK-2** (2026-06-10): flag removed, first real suite (6 tests) landed.                                                                                                                                                                  | TASK-1      |
| D-2 | 2026-06-10 | ~~`node:fs.watch` recursive unreliable on Linux.~~ **DOWNGRADED at TASK-33:** the engines floor is Node ≥24, and node:fs.watch documents recursive support on Linux since v19.1 — the concern predates our floor. Residual: one Linux smoke before any OSS release (cannot verify on this macOS machine). | TASK-10     |
| D-3 | 2026-06-11 | ~~Agent-run records in-memory only.~~ **RESOLVED at TASK-33:** finished runs persist to the runtime db (running ones deliberately not — a stale "running" from a dead server would lie); restart-survival proven by T45.                                                                                  | TASK-28     |
| D-4 | 2026-06-11 | ~~App.tsx + http.ts past the ≤200 target.~~ **RESOLVED at TASK-33:** http.ts split into context/helpers (77) + routes.ts (239, the one coherent API surface — rule 12's "never fragment coherence" applies); App.tsx (229) is the shell and stays whole on the same grounds.                              | TASK-30     |

# Tech Debt Ledger

Appended immediately when incurred (CLAUDE.md rule 23). Format:
`D-n · date · what we owe · why we took it · task that incurred it`

| ID  | Date       | What we owe                                                                                                                                                                               | Incurred by |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D-1 | 2026-06-10 | ~~vitest `passWithNoTests` — empty suite passed.~~ **RESOLVED at TASK-2** (2026-06-10): flag removed, first real suite (6 tests) landed.                                                  | TASK-1      |
| D-2 | 2026-06-10 | `node:fs.watch` recursive is unreliable on Linux (AD-4); fine on macOS/Win. Revisit (chokidar or per-dir watchers) before OSS release; doctor should warn on Linux.                       | TASK-10     |
| D-3 | 2026-06-11 | Agent-run records (`agentRuns`) are in-memory only — a server restart forgets a failed launch, so its red chip silently reverts to "in agent inbox". Persist last runs to the runtime db. | TASK-28     |
| D-4 | 2026-06-11 | src/App.tsx (222) and src/server/http.ts (234) drifted past the ≤200-line target as panels/routes accumulated. Split a panel dock / route table next time either is touched.              | TASK-30     |

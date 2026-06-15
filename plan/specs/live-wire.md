# Slice spec — S4 "live-wire"

- **Status:** ✅ auto-approved (GATE 2, autonomous mode DEC-20) · 2026-06-10
- **Source:** [01-system-map.md §3](../01-system-map.md) (S4) · **Features:** server core, security model (R7), live updates

**Goal:** the real Courtside server exists. `npm run dev` boots it against the
fixture project: token-gated, loopback-only, serving the dashboard, watching the
plan dir, validating on change, pushing updates over WebSocket, logging to SQLite.

## Agent-decided architecture (rule-16/open-question resolutions per DEC-20)

| #    | Decision                                                                                                                                                                                                                                                                                                                  | Why (alternative rejected)                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AD-1 | SQLite via **`node:sqlite`** (stdlib); `engines.node >= 24`                                                                                                                                                                                                                                                               | zero deps, no native build on fresh clone (<15-min criterion); supersedes CLAUDE.md "Node 20+" — better-sqlite3 rejected (native compile risk) |
| AD-2 | Server/CLI run as **native TypeScript** (Node 24 type stripping); `erasableSyntaxOnly` + `allowImportingTsExtensions`; node-run files use explicit `.ts` import extensions                                                                                                                                                | no build step, no `tsx` dep                                                                                                                    |
| AD-3 | **`ws`** package (+ dev `@types/ws`, `@types/node`)                                                                                                                                                                                                                                                                       | PRD §5 names WebSocket; `ws` is the boring standard; SSE rejected (deviates from PRD text)                                                     |
| AD-4 | Watcher = **`node:fs.watch`** recursive + debounce                                                                                                                                                                                                                                                                        | zero deps; recursive works on macOS/Windows; Linux gap → tech-debt D-2 + future doctor warn; chokidar rejected (dep)                           |
| AD-5 | Harness fixture grows into **`spec/fixtures/sample-project/plan/`**; `state.json` generated from the seed `state.sample.json` by the scaffold script (gitignored — zero drift by construction); companion files (tape, artifacts, gate payload) committed; `decisions-inbox/`, `decisions.md` gitignored (server-written) | seed stays the single source (kickoff-pinned)                                                                                                  |
| AD-6 | Token auth: printed **`?token=` URL** at boot → UI stores localStorage, sends `Authorization: Bearer`; WS authenticates via query token; `crypto.timingSafeEqual`; runtime dir **`.courtside/`** (secret, db, decision log) gitignored                                                                                    | matches PRD R7; Jupyter-style UX for a designer                                                                                                |
| AD-7 | Codegen emits a second artifact **`schema.generated.ts`** (schema as a TS const); `validate.ts` imports it instead of raw JSON                                                                                                                                                                                            | one JSON-import semantics across node/vite/vitest; still drift-checked                                                                         |
| AD-8 | **`npm run dev` = vite build + real server** on 4310 against the fixture project; the pure-Vite path and `publicDir: 'spec'` are retired — one harness, the honest one                                                                                                                                                    | dev parity with real mode                                                                                                                      |

## Behaviors

- **B1 (TASK-10, LOGIC-ONLY → surfaces TASK-11):** AD-7 codegen extension (drift
  check covers both artifacts); engines/tsconfig changes; deps installed; AD-5
  scaffold script + committed companion fixture files; gitignore updates.
- **B2 (TASK-11):** server core — `config.ts` (plan-dir resolution: `--plan-dir` >
  `COURTSIDE_PLAN_DIR` > `./plan` > harness fixture), `auth.ts` (T15 timing-safe
  check; 401 JSON for API, 401 page for HTML), `state.ts` (read+validate via shared
  contract — invalid state returns the error list, never partial state), `http.ts`
  (static `dist/` + `GET /api/state`), `main.ts` (binds **127.0.0.1:4310**, prints
  the token URL once). UI: `lib/api.ts` reads `?token=` → localStorage → fetches
  `/api/state` (the static-fixture fetch dies); tokenless/wrong-token shows a
  "locked out" screen with instructions. Tests: T15 auth, T16 config precedence,
  T17 boot-on-ephemeral-port integration (401 without token, 200+valid JSON with).
- **B3 (TASK-12):** `watch.ts` (recursive fs.watch + debounce, T18) → re-read +
  re-validate → `ws.ts` broadcast (`{kind:'state', state|errors}`) + SQLite event
  rows (`db.ts`: events table + kv table for later last-seen; T19 roundtrip). UI
  connects WS (token query), live-applies updates, shows a small connection dot in
  the header (ok=live, muted=connecting, risk=lost). Invalid mid-edit states render
  the refusal view live, then recover. T20: ws client receives a state broadcast
  after a watched-file change (integration, ephemeral port).

## Visual criterion (slice)

`npm run dev` prints `http://127.0.0.1:4310/?token=…`; opening it shows the
dashboard (now server-served); opening without the token shows the locked-out
screen. Editing `spec/fixtures/sample-project/plan/state.json` (e.g. narration text)
updates the page **without reload** within ~a second; breaking the JSON flips the
live refusal view; fixing recovers. Header shows the live dot.

**Out of scope:** decisions/gates API (S5), doctor (S6), tape/huddle endpoints (S7).
**New deps:** `ws` (runtime); `@types/ws`, `@types/node` (dev). **Open questions:** none new.

---

GATES 3+4 (auto, DEC-20): TASK-10 (logic-only) → TASK-11 → TASK-12.

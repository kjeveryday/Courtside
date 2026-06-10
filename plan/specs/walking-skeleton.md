# Slice spec — S1 "walking-skeleton"

- **Status:** ✅ **GATE 2 approved 2026-06-10** (DEC-10)
- **Date:** 2026-06-10 · **Source:** [01-system-map.md §5](../01-system-map.md) (approved DEC-8)
- **Gate question (framework §1):** *Spec confirmed, questions answered?*

**Goal:** a permanently working harness (framework Phase 1.5). After S1, `npm run dev`
serves a fixture-driven page at `127.0.0.1:4310`, the contract pipeline
(schema → generated types → runtime validation) exists end-to-end, and `npm run check`
is green. Every later slice builds inside this.

---

## 1. Behaviors (numbered; each becomes test/verify material)

### B1 — Scaffold & scripts
1. Vite + React + TypeScript (strict) + Tailwind project at repo root; npm with
   committed lockfile; `package.json` is `private`, `"license": "MIT"`,
   `"engines": { "node": ">=20" }` (stack rule; S4 may revisit for `node:sqlite`).
2. A `LICENSE` file (MIT) — PRD header says MIT from day one.
3. Scripts:
   - `dev` — serves on **127.0.0.1:4310, strictPort** (rule 15 bind; rule 10 names the
     port; if 4310 is busy, fail loudly rather than drift to another port).
   - `test` / `test:watch` — vitest.
   - `codegen` — regenerate contract types from the schema.
   - `lint`, `format:check` — ESLint (flat, typescript-eslint, react-hooks,
     eslint-config-prettier) and Prettier.
   - `check` — codegen-drift + typecheck + lint + format:check + test. Must be green
     at every task's end (rule 18).
4. Tailwind is wired and used minimally; **no design tokens/fonts yet** (S2 owns the
   design language; S1 renders unstyled-but-tidy with system fonts).

### B2 — Contract codegen (rule 13)
1. `npm run codegen` runs json-schema-to-typescript on
   [spec/state.schema.json](../../spec/state.schema.json) →
   `src/contract/state.generated.ts`, with a "GENERATED — do not edit" header.
2. The generated file is **committed** (reviewable; repo works without a codegen
   step), and `npm run check` **fails if regenerating changes it** (drift check —
   the mechanical enforcement of "never hand-drift a duplicate type").

### B3 — Runtime validation
1. `src/contract/validate.ts` exports
   `validateState(data: unknown): { ok: true; state: CourtsideState } | { ok: false; errors: string[] }`.
2. ajv (draft-07) + ajv-formats (the schema uses `date-time`), `allErrors: true`;
   errors formatted as `instancePath — message` (e.g. `/agent/state — must be equal
   to one of the allowed values`).
3. No partial acceptance: unknown keys, wrong enums, bad patterns all fail (the
   schema's `additionalProperties: false` does the work; the validator just must not
   weaken it).

### B4 — Fixture loading & the page
1. The app **fetches the fixture at runtime** and validates it with B3 before
   rendering — the same load→validate→render-or-refuse path the real server will
   own later. (Rejected alternative: build-time JSON import — it would typecheck but
   skip the runtime validation path, making the harness lie about how real mode works.)
2. One copy of the fixture on disk: Vite serves the existing `spec/` directory (e.g.
   `publicDir: 'spec'`), so the app fetches `/fixtures/state.sample.json` from its
   source location. No copies, no sync step.
3. **Valid fixture renders:** a plain header ("Courtside"); a green line
   `fixture validates ✓ courtside/v0`; a chip with `phase` + `slice`; an agent block:
   `state` (e.g. `parked_at_gate`), "since" time, narration (italic), `currentTask`.
   All values come from the fetched fixture — nothing hardcoded.
4. **Invalid fixture renders the refusal state:** red `fixture invalid ✗`, the
   formatted error list, and **no state data at all** (no partial trust — §5 spirit).
   Fetch/parse failures (missing file, broken JSON) land in the same refusal state
   with the underlying message.

### B5 — Tests (vitest; pure logic only — browser behavior is the human's per rule 19)
| # | Test | Expects |
|---|---|---|
| T1 | fixture file (read from disk) → `validateState` | `ok: true` |
| T2 | fixture minus required key (`agent`) | `ok: false`, error names `/agent` |
| T3 | bad enum (`agent.state = "napping"`) | `ok: false` |
| T4 | bad pattern (task id `T-12`) | `ok: false` |
| T5 | extra unknown top-level key | `ok: false` |
| T6 | non-object input (`null`, `"hi"`) | `ok: false`, no throw |
| — | codegen drift | covered by `npm run check` script, not vitest |

## 2. Edge cases & non-goals (explicit)

- Port 4310 occupied → `strictPort` exits with an error; documented in README.
- Narration over the schema's 280-char max → validation failure (refusal state), no
  UI truncation logic in S1.
- **Not in S1:** design tokens/fonts (S2) · `Verified<T>/Claimed<T>` UI enforcement
  (S2, with the first claim-rendering UI) · server/token auth/SQLite/WebSocket (S4 —
  S1's Vite dev server is dev tooling on loopback, *not* the Courtside server; the
  rule-15 token applies to the real server when it exists) · `courtside` CLI bin
  (with S6 doctor; npm scripts suffice until then, per DEC-5) · anything M2+.

## 3. File layout (≤200 lines per file, rule 12)

```
index.html  vite.config.ts  tsconfig.json  eslint.config.js  .prettierrc  LICENSE
src/main.tsx            — mount only
src/App.tsx             — fetch → validate → status page (B4)
src/index.css           — tailwind entry
src/contract/state.generated.ts   — codegen output (committed)
src/contract/validate.ts          — B3
src/contract/validate.test.ts     — T1–T6
scripts/check-codegen.mjs         — drift check used by `npm run check`
```

## 4. Visual criterion (rolls up to the S1 tasks' GATE 5s)

Run `npm run dev`, open `http://localhost:4310`:
- header **Courtside** · green **fixture validates ✓ courtside/v0** · chip
  **phase 5 · battle-core** · agent block **parked_at_gate**, since 7:42 PM,
  *"Wired range overlay into DebugBattle; all 14 GUT tests green. Next: your
  review."*, **TASK-12**.
- Then break it: edit `spec/fixtures/state.sample.json`, set `"state": "napping"` →
  browser shows the red refusal state naming `/agent/state`; undo → green returns.

## 5. Traceability & open questions

- Sources: CLAUDE.md rules 8–13, 15 (bind), 17–18; framework §2 (harness first);
  PRD §5 (stack, no-partial-trust), §10 (contract), header (MIT); DEC-5, DEC-8.
- Dependencies: exactly the GATE-1-approved list (DEC-8); nothing new.
- **New open questions: none.** Q-6/Q-7 don't touch S1.

---

## ⛩ GATE 2 — spec confirmed?

Approval unlocks Phase 3: decomposing S1 into task cards in `/plan/backlog.md`
(expected: ~3 cards — scaffold+check, contract pipeline, fixture page).

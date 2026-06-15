# GATE 5 — TASK-31 completion report

**Pre-game setup wizard** · 2026-06-11 · DEC-37 · commit 77fe675

## TL;DR

Your #2: point Courtside at an empty project and it now greets you with
**Pre-game setup** instead of a refusal screen. A few answers — the game, the
design doc, the engine, optionally your agent — and one click stands the whole
project up: durable config, starter docs, a fresh plan. The live board takes
over in place, no reload.

## The questions (and what they honestly do)

1. **The game** — its name (prefilled from the folder).
2. **Design doc** — three paths: pick a markdown file the wizard found in the
   project; paste a doc (becomes gdd.md); or describe the game in your words —
   the starter gdd.md embeds your description and marks the rest as what your
   agent expands WITH you in Phase 0. No invented content.
3. **Engine** — godot / unity / none. `project.godot` is auto-detected; the
   doctor then checks it for real (pass when present, an honest warn with a
   fix-it when the config says godot but the file isn't there). Unity is
   recorded and explicitly marked "adapter not built yet".
4. **Agent (optional)** — the command that powers send-to-agent and written
   ask answers, with a **test ▸** that runs one tiny prompt through it; the
   UI says plainly that the test costs a sliver of agent credit. Skippable —
   the doctor shows how to connect later.
5. **What happens** — the exact write/keep receipt before you click.

## What gets written (and never overwritten)

`courtside.config.json` (new: the durable per-project settings — agent command
precedence is now override > env > config everywhere), `gdd.md`, a starter
`CLAUDE.md` (gates, inbox-first, narration, provenance honesty, local-only),
a copy of `docs/framework-v2.md`, and a contract-validated `plan/state.json`.
Anything that already exists is kept and reported as kept — re-running setup
on a set-up project is refused (409).

## Verify (browser)

1. `npm run dev:new` → the wizard renders (scratch project under .sandbox/,
   gitignored).
2. Describe a game, pick godot, submit → the live board appears **in place**;
   the ticker's first row is the verified "project set up — wrote …" receipt.
3. Header dot → doctor shows `config — "<your game>" · engine godot` and the
   honest engine warn (no project.godot in a scratch folder).
4. Ask ▸ "how do I send work to the agent?" — the guide answers in this brand
   new project too.
5. Stop the server, `npm run dev:new` again → straight to the board; the
   wizard only exists for projects without a plan.

## Tests

`npm run check` fully green: **95/95 tests, 25 files** (new: T41 config
round-trip/precedence/corrupt-file ×3; T42/T43 setup — empty-project setup
mode, full describe-mode setup with live config pickup, double-setup 409,
test-agent round trip, no-overwrite honesty, traversal rejection ×6; doctor
engine check). Live smoke 11/11 including the ws push that flips wizard →
board and a reboot landing on the board.

## Notes

"The MCP" from your original message maps to the agent command in this
architecture — gates and dispatches work through plan files, no MCP needed
(the doctor line says exactly that). MCP live-mode remains a future item.

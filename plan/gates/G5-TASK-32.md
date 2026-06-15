# GATE 5 — TASK-32 completion report

**Wizard: pick the folder; one design-doc box** · 2026-06-11 · DEC-38 ·
commit b6d3419

## TL;DR

Both of your wizard notes, fixed:

1. **Pick where the files live.** The wizard's first field is now the project
   folder — any absolute or `~/…` path. Leaving the field checks it
   immediately: a bad path is named (missing parent, a file, the demo
   fixture), a good one refreshes the wizard with what's actually in that
   folder (name, markdown files, `project.godot`). When you submit, the
   server _follows the project_: the watcher, runtime store, and repo link
   all re-point at the chosen folder in place, and the live board arrives
   over the same connection — same server, same token, no restart, no
   terminal.
2. **One box for the design doc.** "Paste it" and "describe the game" were
   the same control twice. Now: _use a file I have_ or _write / paste it_,
   with one visible rule — text that already has markdown headings lands in
   `gdd.md` byte-for-byte; a plain description gets the starter sections your
   agent expands with you in Phase 0. The "what happens" receipt says which
   one will happen before you click.

## Verify (browser)

1. `npm run dev:new` → in **where**, type a new path like
   `~/Desktop/wizard-test` and tab out — "✓ this folder".
2. Paste a full doc (with `#` headings) → receipt reads "gdd.md (your text,
   verbatim)"; clear it and type one sentence → "(+ starter sections)".
3. Submit → the live board appears; check Finder: the files are in
   `~/Desktop/wizard-test`, and the scratch `.sandbox` folder stayed empty.
4. Type a relative path or a path with a missing parent → the field tells
   you exactly what's wrong; nothing is written.

## Tests

`npm run check` fully green: **101/101 tests, 25 files** (new: T44
resolveProjectDir — ~ expansion, relative/missing-parent/file/fixture
refusals; the info preflight; setup-in-a-picked-folder with the server
following; verbatim paste). Live smoke 9/9 — including the ws push for the
re-pointed folder, the boot folder left untouched, and doctor + ask serving
the new project immediately.

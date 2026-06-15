# GATE 5 · G5-TASK-11 — ✅ auto-approved (autonomous mode, DEC-20)

## TASK-11 — done (2026-06-10)

**TL;DR:** The real Courtside server exists. `npm run dev` now builds the UI and
boots a 127.0.0.1-only Node server on 4310 that prints a one-time token URL, serves
the app shell, and answers `/api/state` (validated, never partial) only with the
token. The browser stores the token from the URL and locks itself out without it.

**Verify:** `npm run dev` → terminal prints `http://127.0.0.1:4310/?token=…` → that
URL shows the dashboard; plain `http://localhost:4310` in a private window shows
the amber "Locked — token required" screen.

**Evidence:** T15/T16/T17 green (25/25 total — T17 boots the server in-test:
401 tokenless, 401 wrong token, 200+`courtside/v0` with token, 404 unknown route);
live smoke: 401/200/200 sequence captured in session. Static serving is
path-traversal-guarded; bind host is a constant, not config.

**Deviations vs spec B2:** the app shell is served without a token (data stays
gated; Jupyter-style flow) — spec said "401 page for HTML"; shell-open is the
correct call because a token-gated document breaks reloads (localStorage can't
authenticate a document request). Recorded here as the implemented behavior.

**Debt:** none. **Next:** TASK-12 watch → validate → WS push + SQLite event log.

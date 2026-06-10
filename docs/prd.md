# PRD: Courtside

## A mission-control dashboard for human + AI-agent game development

**Status:** Draft v1.1 (revised after adversarial review) · **Owner:** Kyle ·
**License target:** MIT (open source from day one)

---

## 1. Problem

Novice and non-coder builders working with coding agents (Claude Code) suffer from an
observability gap: the agent does real work, but the human "can't see anything."
Plan state lives in scattered markdown files, gate approvals happen in a terminal
scrollback, narration gets buried, and progress is invisible — which kills both
confidence and momentum.

The process layer already exists (framework-v2: phases, gates, task cards, completion
reports, plan artifacts). What's missing is the **window onto it**: a place to watch the
agent work, understand why, answer its questions, approve its gates, and feel progress.

## 2. Product vision

Courtside is a local-first, open-source web dashboard that turns an agentic dev
workflow into a legible, reviewable, slightly-gamified team experience. The name is the
thesis: the human sits courtside — close enough to see every play, with the authority
to call timeouts. The agent runs the floor; the human coaches.

**One-line:** See everything your agent does, approve what matters, and feel the
progress — without leaving your seat.

## 3. Goals / non-goals

**Goals**

- G1: Make all plan state (phases, slices, tasks, gates, questions, debt, decisions)
  visible at a glance and drillable to source.
- G2: Move gate approvals (G0–G5) and open-question answers out of the terminal and
  into structured, auditable UI.
- G3: Give every task a "verify in 60 seconds" flow the human can follow and check off.
- G4: Motivate through honest progress signals (milestones, streaks, achievements) via
  a modular theme system — clean/pro by default, fully skinnable (Ballhalla pack first).
- G5: Be adoptable by strangers: engine-agnostic, agent-convention-based, MIT, with a
  documented spec for the data contract and themes.

**Non-goals (v1)**

- Not an IDE, code reviewer, or diff tool (link out to files; don't re-implement git UIs).
- Not a Claude Code wrapper or replacement terminal; the agent still runs where it runs.
- Not cloud/multi-user; local-first single-player. (Multi-user is a future maybe.)
- Not a general project-management tool; it is opinionated around the gated framework.
- Not remotely accessible in v1 — no phone approvals, no tunnels, no hosted mode.
  (Real tension for mobile-heavy users; parked deliberately, see OQ5.)

## 4. Users

- **P1 — The designer-dev (primary):** reads logic, doesn't write code; rich design
  docs; works nights/weekends; needs legibility, confidence, and momentum.
- **P2 — The OSS adopter:** any solo dev or small team running a gated agentic
  workflow; needs easy setup, a clear data contract, and theme/engine neutrality.
- **P3 — The agent (yes, a user):** Claude Code needs a dead-simple, reliable way to
  publish state and request decisions. If the contract is fiddly, the agent drifts.

## 5. Architecture (the part that makes copilot mode honest)

```
┌────────────────────┐   writes    ┌──────────────────────┐
│ Claude Code (CLI)  │────────────▶│ /plan/*.md (human)   │
│ follows framework  │             │ /plan/state.json     │
│                    │             │   (machine mirror)   │
│  MCP client        │             └──────────┬───────────┘
│        │           │                        │ file-watch
│        ▼           │                        ▼
│  Courtside MCP ────┼──────────▶  ┌──────────────────────┐
│  (gates/questions) │  HTTP/stdio │ Courtside server     │
└────────────────────┘             │ (Node, local)        │
                                   │  - watcher + parser  │
                                   │  - MCP server        │
                                   │  - event log (SQLite)│
                                   └──────────┬───────────┘
                                              │ websocket
                                              ▼
                                   ┌──────────────────────┐
                                   │ React app (browser)  │
                                   └──────────────────────┘
```

**Two integration channels, by design:**

1. **File contract (passive, M1).** The agent already maintains `/plan/*.md`. Add one
   convention to CLAUDE.md: also write `/plan/state.json`, a machine-readable mirror
   (schema in §10). Courtside watches and renders it. Zero coupling: if Courtside dies,
   the workflow still works in the terminal; markdown remains the human-readable truth.
2. **Async decision loop (primary, M1).** Gates are asynchronous by design. The agent
   posts a gate (`/plan/gates/<id>.json` + state.json entry), **ends its turn cleanly**
   with a session summary, and stops burning usage. The human decides whenever —
   tonight, tomorrow — and Courtside writes the decision to
   `/plan/decisions-inbox/<id>.json`. Every agent session **begins** by reading the
   inbox (a CLAUDE.md rule) and acting on decisions before new work. Rationale: a
   blocking gate assumes a human sitting at the desk; the actual user has a job, kids,
   and a board seat. Blocking burns the 5-hour usage window on idle waiting, and a
   dead session loses gate state. Async file-backed gates survive everything.
3. **MCP live mode (optional, M2).** For co-working sessions when the human _is_
   present, Courtside's MCP server offers `request_gate_approval` (short timeout →
   falls back to parking the gate async), `post_question`, `post_progress`, and
   `get_pending_feedback`. Live mode is a latency upgrade, never a dependency.
   Terminal approval remains the final fallback if Courtside isn't running.

**Core data principle — verified vs. claimed.** The dashboard must never launder agent
claims into facts. Every datum carries provenance:

- **Verified:** Courtside executed or parsed it itself — doctor checks, lint, git
  history, test runs invoked via F15 hooks, raw output artifacts.
- **Claimed:** agent-authored text — narration, TL;DRs, "self-audit clean."
  The UI renders these differently (solid badge vs. outlined "agent-reported" badge).
  Where cheap, Courtside re-runs the proof (e.g., headless test suite) rather than
  trusting the report. Corollary: derive as much of state.json as possible
  **mechanically** — from git history and Claude Code hooks rather than agent
  discipline — because agents drift after context compaction and `lint` only detects
  drift after the dashboard has already gone stale.

**Security model.** A localhost server whose buttons authorize a code-executing agent
is an attack surface, and an OSS tool can't hand-wave it:

- Server binds to `127.0.0.1` only; no network interface exposure, CORS locked to the
  served origin.
- Browser sessions authenticate with a token printed at server start.
- Gate decisions and question answers are written to an **append-only, HMAC-signed
  decision log** (local secret created at init); the agent and the auditor can verify
  decisions weren't forged or edited after the fact.
- Human answers flowing into the agent's context are wrapped as **data, not
  instructions** (structured answer objects, not freeform prompt injection paths),
  and CLAUDE.md instructs the agent to treat inbox content as answers to its own
  questions only.

**Stack:** Node + TypeScript server, SQLite event log, React + Tailwind front end,
WebSocket updates. Installs via `npx courtside` in any repo with a `/plan/` directory.

## 6. Core features

### M0 — Set up (preflight & doctor)

- **F0 Preflight wizard + `courtside doctor`:** a first-run guided checklist in the UI,
  backed by a re-runnable CLI health check. Same checks, two surfaces. Categories:
  - **Environment:** Node/npm versions; git repo detected; **GitHub connection** —
    remote configured, auth working (`gh` CLI or token), push access verified with a
    dry-run; engine installed and on a supported version (Godot 4.x + .NET SDK for
    C#), with the engine check implemented
    as a _plugin_ so OSS users can swap in Unity/other adapters.
  - **Agent:** Claude Code installed and on a known-good version; `CLAUDE.md` present
    and containing the required framework rules (checksum/marker-based check);
    Courtside's MCP server registered in the agent's config; **live MCP handshake
    test** — the doctor actually round-trips a `ping` tool call and reports latency,
    not just "config file exists."
  - **Project:** `/plan/` directory scaffolded; framework doc present; design-docs
    path configured and every listed doc readable; `state.json` validates against the
    schema (`courtside lint` runs as part of doctor); oversized design files flagged
    with a context-window warning and a suggested section-map step.
  - **Harness:** DebugBattle scene exists at the configured path; headless engine
    launch succeeds; test framework (GUT) runs and reports.
  - Each check returns pass / warn / fail with a one-line **fix-it instruction**, and
    auto-fix is offered only for safe, reversible items (scaffold `/plan/`, write MCP
    config entry, add missing CLAUDE.md block). Anything touching the engine or agent
    install is instructions-only.
  - The dashboard header carries a persistent **health badge**; any check that decays
    mid-project (MCP disconnected, stale state.json, Godot updated to an untested
    version) flips it from green and links straight to the failing check.
  - Theme hook: in the Ballhalla pack this whole flow is the **"Pre-Game Warmup"** —
    you don't tip off until warmups are done.

### M1 — See (read-only mission control)

- **F1 Status board:** current phase, active slice, active task, agent state
  (working / waiting-at-gate / blocked / idle), last narration line.
- **F2 Backlog view:** task cards with status, dependencies (mini-graph), risk flags,
  visual criterion shown prominently. Click → full card + source-doc reference.
- **F3 Progress:** milestone completion bars, tasks done over time, slice burndown.
- **F4 Narration ticker:** timestamped feed of the agent's why/what's-next lines and
  completion-report TL;DRs (parsed from state.json events).
- **F5 Ledgers:** open questions, tech debt, and decisions as first-class lists with
  age indicators ("question open 6 days" should itch).

### M2 — Decide (the copilot loop)

- **F6 Gate inbox:** pending gates rendered as decision cards — TL;DR, what-to-check
  checklist, links to artifacts/diffs. Actions: Approve / Reject with comment /
  Request changes. Every decision is logged (who/when/what) to the event log and
  appended to `/plan/decisions.md`.
- **F7 Verify mode (GATE 5):** the completion report's "verify in 60 seconds" steps
  rendered as an interactive checklist; approval unlocks only when all steps are
  checked (or explicitly skipped with a reason).
- **F8 Ask-anything on click:** select any task/file/decision → ask a question →
  queued to the agent via MCP (or `/plan/inbox.md` fallback) → threaded answer appears
  on that object. Conversation stays attached to the thing it's about.
- **F9 Question responder:** agent's open questions appear with its 2–3 options and
  labeled recommendation; human picks or writes their own; answer flows back via MCP.
- **F16 GitHub connect (optional, recommended):** Courtside links work to the repo
  history rather than re-implementing git UI (per non-goals):
  - **Commit-per-task convention:** the agent commits each completed task with its
    TASK-ID in the message; gate cards and completion reports deep-link to the
    commit/diff on GitHub, so "review the diff" at GATE 5 is one click in a UI built
    for diffs.
  - **Branch-per-slice, PR-per-slice (opt-in):** each slice lives on a branch; slice
    completion opens a draft PR, giving a natural review surface and a clean revert
    boundary if a slice goes wrong.
  - **Session-end push:** after the last gate of a session, the agent pushes — your
    plan state and code are backed up off-machine every session.
  - **Decision audit trail:** gate decisions logged by Courtside reference the commit
    SHA they approved, so "what exactly did I sign off on?" is always answerable.
  - Courtside itself stays local-first: GitHub is a linked remote, never a dependency.
    If offline or unauthenticated, everything still works; links gray out.
- **F17 Game Tape (screenshots as evidence):** the agent captures stamped frames of
  the DebugBattle scene at deterministic moments — after wiring a task into the
  harness and at each verify-relevant state — saved to `/plan/tape/<task-id>/` with
  timestamp + commit SHA burned into the frame metadata.
  - Gate cards show the filmstrip; completion reports reference frames by number;
    the human can click any frame and ask a question threaded to it ("frame 3 —
    why is the corner tile excluded?").
  - **Engine note:** Godot `--headless` doesn't render; capture requires a brief
    windowed/offscreen run via a screenshot autoload. This is a real harness task
    (ships with Phase 1.5), and the doctor gains a "capture works" check.
  - **Hard rule:** tape is _evidence_, never _verification_. A screenshot proves one
    frame looked right once — it can be stale or show the wrong state. Verify-step
    checkboxes can never be auto-checked from tape; Play Mode remains the test.
  - Tape frames are **verified-provenance** data (Courtside can confirm file mtime
    and SHA match the commit), which is exactly why they're worth more than prose.
- **F18 Verified/claimed badges:** every fact on the dashboard carries its provenance
  badge per the §5 data principle. Test results shown as verified only when Courtside
  ran the suite via an F15 hook or parsed the raw runner output; an agent sentence
  saying "all tests pass" renders as _agent-reported_ until proven. The gate card's
  meta row is the flagship use: ✓-verified vs ◇-claimed at a glance.
- **F19 Rejection & escalation flow:** rejection is a first-class path, not a button.
  - Reject requires a comment; the task enters a `revise` state and the resubmitted
    gate card highlights **what changed since the rejection** (new commits, updated
    report sections) so re-review is cheap.
  - Each card carries a visible rejection counter. **Three rejections on one task
    auto-blocks it** — the agent stops, and the card converts to a discussion thread;
    process repetition is evidence the task or spec is wrong, not the code.
  - Rejections that catch a real spec violation are celebrated ("Charge Taken"), and
    all rejections feed the audit log as signals about where the agent drifts.
- **F20 The Huddle (catch-up briefing):** a "what's going on right now?" button that
  answers it in 15 seconds for a human returning cold. Two tiers:
  - **Tier 1 — deterministic briefing (ships in v0.1 Lite):** Courtside tracks the
    human's last-seen timestamp (SQLite) and renders a template-generated diff:
    _"Since you last looked (5 days ago): 2 tasks shipped (TASK-11, TASK-12) ·
    1 gate waiting on you (GATE 5 · TASK-12) · Q-7 still open, 6 days, blocking
    TASK-15 · agent parked since Tue."_ All facts computed from state.json + decision
    log — zero AI, zero cost, verified provenance, can't hallucinate.
  - **Tier 2 — narrative huddle (v0.2, opt-in):** a small model (Claude Haiku via the
    user's own Anthropic API key) writes 3–5 sentences of narrative glue _around_ the
    Tier-1 facts — what the slice is trying to achieve, why the open question
    matters, what your one decision today should be. The model receives only the
    deterministic fact set, not raw repo content, which bounds both cost (fractions
    of a cent per huddle) and hallucination surface. Follow-up questions route to
    click-to-ask (F8).
  - **Provenance rule:** Tier-1 facts render verified; the narrative paragraph renders
    with a distinct _generated_ badge — it is an interpretation, never evidence.
  - **Security/cost:** the API key is user-supplied, stored locally outside the repo,
    and is the only sanctioned outbound call besides GitHub. Note for subscription
    users: API calls bill separately per-token from a claude.ai plan — at Haiku
    prices, a per-session huddle is pennies per month.
  - Theme hook: Front Office calls it "Briefing"; Ballhalla calls it **"The Huddle."**

### M3 — Feel (gamification + theming)

- **F10 Theme engine:** themes are JSON packs (palette, type, copy strings, icons,
  achievement definitions, progress metaphor) loaded at runtime. Ships with:
  - **Base — "Front Office":** clean, quiet, professional. Default for OSS users.
  - **Ballhalla pack:** progress as a court (each milestone advances ball up the
    floor; shipping a slice scores a bucket), XP per completed task weighted by risk,
    achievements ("First Bucket" — first task shipped; "And-One" — task approved with
    zero rejections; "Lockdown Defense" — audit pass with zero findings; "Heat Check"
    — 5 approvals in one session), end-of-session box score (tasks, tests added,
    questions resolved, debt paid down).
- **F11 Honest-metrics rule:** gamification rewards _verified_ outcomes only (gate
  approvals, passing audits, resolved questions) — never raw activity like lines of
  code or message count. No streak mechanics that pressure daily use; streaks count
  sessions, not calendar days. Fun must never create an incentive to rubber-stamp.
  **Anti-gaming:** the agent can inflate "approvals" by writing trivially easy verify
  steps or splitting work into micro-tasks. Countermeasures: XP is risk-weighted (a
  pile of low-risk micro-tasks scores less than one med-risk task), and the
  per-feature audit explicitly checks that verify steps map to the acceptance
  criteria rather than to whatever happens to be easy to demonstrate.
- **F12 Session recap:** shareable end-of-session summary card (theme-styled).

### M4 — Share (OSS readiness)

- F13: `npx` quickstart, sample repo, data-contract spec doc, theme-authoring guide.
- F14: Agent-setup snippets — drop-in CLAUDE.md rules + MCP config for Claude Code.
- F15: Engine-agnostic verification hooks (a task's verify steps can include a shell
  command, e.g. run headless tests, with output captured into the gate card).

## 7. Design direction

- **Aesthetic:** "broadcast scorebug meets mission control" — calm, dense-but-legible
  information design. The base theme earns trust through restraint: a disciplined
  type scale (one characterful display face for numbers/states, a quiet body face),
  generous whitespace, and a single accent used only for _things awaiting the human_.
- **Signature element:** the **Gate** — a full-width decision strip that physically
  separates "what the agent did" (above) from "what happens next" (below, dimmed until
  approved). The UI itself enacts the process: nothing below a gate renders in full
  color until the gate is cleared.
- **Motion:** one orchestrated moment per event class — a gate clearing, a milestone
  scoring. No ambient animation. Reduced-motion respected.
- **Copy:** plain verbs, user-side language ("Approve gate," "Answer question,"
  "Verify step 2 of 4"). Errors say what happened and what to do.
- Accessibility floor: keyboard-completable approvals, visible focus, mobile-readable
  status board (read-only on small screens is fine; approvals need ≥ tablet width).

## 8. Critical UX flows

1. **Morning check-in:** open dashboard → status board shows agent waiting at GATE 3
   → gate card lists 7 new task cards → skim, leave one comment ("split TASK-9"),
   approve the rest → agent resumes; ticker narrates.
2. **GATE 5 verify:** notification badge → completion report card → follow 4 verify
   steps with the game running side-by-side → check each → approve → court advances,
   "And-One" unlocks → next task auto-starts.
3. **Drive-by question:** notice a decision in the ledger you don't understand → click
   → "why did we choose pattern X here?" → answer threads onto the decision record.

## 9. Success metrics

- **Setup:** fresh repo reaches an all-green doctor in <15 minutes without outside
  help; doctor catches misconfiguration before the first agent session (zero "agent
  ran but nothing appeared" reports from OSS users).
- **Legibility:** human can answer "what is the agent doing right now and why?" in
  <10 seconds (self-report, then usability test with OSS users).
- **Loop speed:** median time-to-gate-decision drops vs. terminal baseline.
- **Trust:** % of GATE 5 approvals where all verify steps were actually checked (target
  > 90%; if humans skip steps, the verify UX has failed).
- **Adoption (OSS):** 10 external repos using the data contract within 3 months of
  release; ≥1 community theme pack.

## 10. Data contract (v0 sketch)

`/plan/state.json` — schema-versioned; **mechanically derived where possible** (git,
hooks), agent-written where necessary, every entry carrying provenance:

```json
{
  "schema": "courtside/v0",
  "phase": "5", "slice": "battle-core",
  "agent": {"state": "parked_at_gate", "since": "...", "narration": "..."},
  "gates": [{"id": "G5-TASK-12", "type": "task_review", "payload_ref": "...",
             "tape": ["tape/TASK-12/frame-001.png"], "commit": "3f8a21c"}],
  "tasks": [{"id": "TASK-12", "title": "...", "status": "in-review",
             "risk": "med", "deps": ["TASK-10"], "visual_criterion": "...",
             "source_ref": "gdd.md#shot-resolution", "rejections": 0}],
  "questions": [...], "debt": [...], "decisions": [...],
  "events": [{"ts": "...", "kind": "narration|test_run|audit",
              "provenance": "verified|claimed", "text": "..."}]
}
```

Companion files: `/plan/gates/<id>.json` (full gate payloads, agent-written),
`/plan/decisions-inbox/<id>.json` (human decisions, Courtside-written, HMAC-signed),
`/plan/tape/<task-id>/` (stamped frames). Markdown files remain canonical for humans;
`state.json` is a derived mirror. `courtside lint` checks sync, schema validity, and
signature integrity of the decision log.

## 11. Risks & mitigations

- **R1 Agent drift from the contract** (stale state.json, esp. after context
  compaction). → derive state mechanically from git/hooks wherever possible (§5);
  `courtside lint` in the audit cadence; "state freshness" badge; markdown fallback.
- **R2 MCP wiring fragility** (sessions, timeouts at gates). → async file-backed gates
  are the _primary_ path (§5); MCP live mode is an optional upgrade; gates can never
  deadlock or strand the agent.
- **R3 Gamification corrupts judgment** (approving to score points; agent farming
  easy approvals). → F11 honest-metrics + anti-gaming rules; rejections and audit
  findings are _also_ celebrated ("Charge Taken").
- **R4 Scope creep toward IDE/PM tool.** → non-goals enforced; v1 cut-line below.
- **R5 Building the tool eats the game.** → Courtside Lite cut (§12): v0.1 is M0 + M1
  - file-backed gate decisions only, sized to 1–2 weekends of agent-built effort;
    Ballhalla resumes on Lite; M2+ built later as framework-run slices.
- **R6 The dashboard amplifies false confidence** by rendering agent claims with the
  authority of a UI. This is the inverse of the product's purpose. → F18
  verified/claimed provenance is a launch requirement, not polish; Courtside re-runs
  proofs where cheap; Game Tape gives an independent evidence channel.
- **R7 Security: the approval surface is an attack surface.** Anything reaching the
  port could approve gates or inject "answers" into the agent's context. → §5
  security model (localhost-only bind, token auth, HMAC-signed append-only decision
  log, answers-as-data); ships with M1, not later.
- **R8 Tape substitutes for verification** (stale/cherry-picked screenshots breed
  rubber-stamping). → F17 hard rule: tape never auto-checks verify steps; frames are
  SHA-stamped so staleness is detectable; verify checklist remains the gate key.

## 12. Milestones & cut-line

- **M1 (v0.1 — "Courtside Lite," the real cut-line):** doctor/preflight (F0), see-
  features (F1–F5), **async gate decisions** — gate inbox + verify mode backed by the
  file contract and decisions-inbox (no MCP), rejection flow basics (F19), security
  model, Game Tape _viewer_ (capture utility ships as a Phase 1.5 harness task),
  deterministic Huddle briefing (F20 Tier 1).
  _Ship when: a full task cycle — gate posted, decided in the UI, agent acts on it
  next session — completes across two sessions without touching the terminal, and a
  fresh clone goes from `npx courtside` to all-green checks in under 15 minutes._
  **Then Ballhalla development resumes.** Everything below is built later, in
  parallel slices, using the framework itself.
- **M2 (v0.2):** MCP live mode, click-to-ask, question responder, verified/claimed
  test re-run hooks (F18 full), narrative Huddle (F20 Tier 2), GitHub connect
  (commit links + session-end push; PR-per-slice may slip to v0.3).
  _Ship when: a live co-working session completes a task cycle in real time._
- **M3 (v0.3):** theme engine + Front Office + Ballhalla packs, achievements, recap.
- **M4 (v1.0):** OSS docs, npx installer, sample repo, theme guide, security review,
  public release.

**v1 cut-line:** anything multi-user, cloud, git-diff rendering, or non-Claude-Code
agent adapters waits. (The data contract is agent-neutral on purpose, so adapters can
come from the community.)

## 13. Open questions

- OQ1: Should gate approvals require a local auth touch (PIN/keypress) to prevent
  accidental approves, or is friction the enemy here?
- OQ2 — **resolved (v1.1):** gates are async-first; the agent parks the gate, ends its
  turn, and reads the decisions-inbox at next session start. Synchronous blocking
  exists only inside MCP live mode with a short timeout that falls back to parking.
- OQ3: Theme pack distribution — npm packages vs. plain JSON files in-repo? Recommend
  JSON-in-repo first.
- OQ4: How much of the completion report should be structured fields vs. freeform
  markdown? (Affects how rich Verify Mode can be.)
- OQ5: Mobile/remote approvals. Async gates make phone-based gate decisions genuinely
  valuable for this user, but remote exposure contradicts the v1 security model.
  Candidate futures: GitHub-PR-as-gate (decide from the GitHub mobile app),
  authenticated tunnel, or a hosted relay. Parked — do not solve in v1.

# Mechanics → Implementation Framework v2
## (Observability Edition — Godot 4 + Claude Code + MCP)

*Operating procedure for Claude Code: convert mechanics docs into small, testable,
**visible** implementation tasks, with human-in-the-loop gates. v2 adds the
observability harness, narration rules, completion report format, and audit cadence
in response to v1's core failure: code that worked but couldn't be seen.*

---

## 0. What changed from v1 (read this first)

1. **New prime directive: every task ends in something the human can see** in a running
   scene, or explicitly declares itself logic-only and binds to the next visual checkpoint.
   Max 2–3 logic-only tasks in a row before a visual checkpoint is mandatory.
2. **New Phase 1.5 — Harness First.** The debug/visualization harness is built *before*
   any mechanic. "Show me" must be cheap before feature work begins.
3. **Narration rule.** Before every step, state in 1–2 plain-language sentences *why* this
   step is happening and *what comes after it*. Never act silently.
4. **Completion report format** (Section 6) is mandatory for every task.
5. **Audit cadence** (Section 8): per-feature audit after every GATE 5, scoped weekly audit.
6. **Docs spine**: README.md is the hub; CLAUDE.md holds always-on rules; this file holds
   the process. Keep all three current.

Everything else from v1 still applies: spec-before-code, vertical slices, atomic tasks,
traceability to source docs, explicit dependencies, ambiguity protocol (log questions in
`/plan/open-questions.md`, never invent values), and mandatory gates.

---

## 1. Phases & gates (v2)

| Phase | Output | Gate question |
|---|---|---|
| 0. Intake & Inventory | `/plan/00-inventory.md` | Is the corpus complete and scope right? |
| 1. System Map & Slicing | `/plan/01-system-map.md` | Approve slices + first slice? |
| **1.5 Harness First** | **DebugBattle scene + overlays + debug panel** | **Can the human see state by pressing Play?** |
| 2. Slice Spec Extraction | `/plan/specs/<slice>.md` | Spec confirmed, questions answered? |
| 3. Task Decomposition | task cards in `/plan/backlog.md` | Right tasks, right size? |
| 4. Sequencing | ordered milestones in backlog | Approve build order + task #1? |
| 5. Per-task loop | code + tests + completion report | GATE 5: verified in-scene by human |

No phase begins until the prior gate is explicitly approved.

---

## 2. Phase 1.5 — Harness First (the fix for "I couldn't see anything")

Before any mechanic is implemented, build the viewing instruments. These are normal
tasks with their own GATE 5 reviews:

- **H1 — DebugBattle scene.** A permanent scene the human opens and runs (F5). Home base
  for all verification. Every subsequent task wires its result into this scene.
- **H2 — Grid & overlay rendering.** Draw the board/tiles visually. Support highlight
  layers (movement range, attack range, path preview) even with placeholder art.
- **H3 — On-screen debug panel.** Corner UI showing: current turn, active unit, last
  action taken, last formula/roll result with its inputs. If a number matters to the
  spec, it must be printable here.
- **H4 — Debug controls.** Hotkeys/buttons: advance turn, select unit, force an action,
  reload scene. Plus a timestamped on-screen log of game events.

**Harness invariants from here on:**
- A task is not done if its effect cannot be observed via the harness (or unit tests
  alone, *only* if declared logic-only at GATE 3).
- New systems must register their key state with the debug panel as part of the task.
- The harness is maintained like production code — if it breaks, fixing it preempts
  feature work.

---

## 3. Narration rule (always on)

For every step — reading a file, writing code, running a test — first state:
- **Why:** what this step accomplishes toward the current task (1 sentence, plain language).
- **Next:** what happens after it (1 sentence).

The human should never have to ask "what is it doing and why?" Silence is a defect.

---

## 4. Task card schema (v2 — adds the visual criterion)

```
### [TASK-ID] <short imperative title>
- Source: <doc/section reference>
- Slice / Milestone: <name>
- Description: <what and why, 1–3 sentences>
- Acceptance criteria: Given/When/Then, testable
- VISUAL CRITERION: what the human will literally see in DebugBattle when this works
  (or "LOGIC-ONLY — surfaces at TASK-XYZ checkpoint")
- Test approach: unit (GUT) / integration / manual-in-harness
- Dependencies: [TASK-IDs] or none
- Risk: low | med | high (+why)
- Status: todo / in-progress / in-review / done
```

A card without a visual criterion (or an explicit logic-only declaration) is invalid.

---

## 5. Per-task loop (Phase 5, v2)

1. Restate acceptance criteria **including the visual criterion**. Confirm understanding.
2. Write GUT unit tests first for any pure logic (formulas, turn order, grid math).
3. Implement the minimum to satisfy the criteria. Narrate per Section 3.
4. Wire the result into the DebugBattle scene (overlay, panel readout, or log line).
5. Run tests + lint headlessly; capture and show results.
6. Run a **self-audit** on the diff: "verify every word — does each change trace to the
   spec? Do not assume." Report discrepancies honestly.
7. Post the **completion report** (Section 6). STOP.
8. **GATE 5:** human presses Play, follows the verify steps, approves or rejects.
   Never auto-advance.

---

## 6. Completion report format (mandatory, every task)

```
## TASK-ID — done, awaiting review

**TL;DR:** <2–3 plain sentences: what changed, what you'll see>

**Verify in 60 seconds:**
1. Open DebugBattle, press Play (F5)
2. <exact clicks/keys>
3. You should see: <specific observable result, incl. panel readouts>

**Why it was built this way:** <2–3 sentences linking choices to spec sections>

**Test results:** <GUT pass/fail summary + lint>

**What's next:** <the next task and why it follows>

**Refactoring opportunities:** <or "none">

**Tech debt incurred:** <or "none"> → also appended to /plan/tech-debt.md

**Open questions raised:** <or "none"> → also logged in /plan/open-questions.md
```

---

## 7. Documentation spine

- **README.md** — hub. Links to: this framework, CLAUDE.md, `/plan/*` artifacts,
  per-system docs in `/docs/systems/`, and how to run the game + tests.
- **CLAUDE.md** — always-on rules only (kept under ~150 lines; it loads every turn).
- **Per-system docs** (`/docs/systems/<system>.md`) — created when a system lands,
  updated when it changes. ~20 focused files beats one monolith.
- **File size guideline:** target ≤200 lines per code file. Split by responsibility when
  exceeded — but never shatter a coherent system just to hit the number; coherence wins.

---

## 8. Audit cadence

- **Per-feature (after every GATE 5 approval):** "Run a full audit on the changes. Do not
  assume — verify every word." Re-read the diff against the spec and the completion
  report; flag any claim that isn't literally true in the code.
- **Weekly (scoped, budget-friendly):** audit only (a) files changed this week,
  (b) freshness of README/CLAUDE.md/plan artifacts, (c) backlog statuses vs reality,
  (d) consolidated tech-debt list. Output: one short report with fix-now vs defer.
- Audits produce findings, not silent fixes. Human approves fixes like any task.

---

## 9. Kickoff prompt

> Read `docs/framework-v2.md` and `CLAUDE.md` and follow them exactly. Begin Phase 0 on
> the mechanics docs in `<path>`. Produce `/plan/00-inventory.md`, narrate as you go,
> and stop at GATE 0. Do not proceed past any gate without my explicit approval.

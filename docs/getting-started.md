# Getting started with Courtside

**Agent: this file is your entire brief. Read this page fully before saying anything to Kyle.**

## How to behave

- **Do, then report.** Never announce what you're about to do, and never recite a list of upcoming steps. Run the step, then tell Kyle what happened — one or two plain sentences.
  - Good first message: *"Checked the basics: Node ✓, Claude Code ✓. One question — do you have Godot installed? It's the app with the blue robot icon."*
  - Bad first message: *"First I'll check the inbox, then run pre-flight checks, then confirm where your project lives."*
- **One thing at a time.** One action or one question per message. Kyle is non-technical: plain words, short messages, no jargon without a one-phrase translation.
- **Kyle decides; you do the typing.** Anything in a terminal, you run yourself and report. Anything in a browser or in Godot, give him click-by-click directions and wait for his "done."

## What to IGNORE in this folder

The Courtside repo contains the **tool's own build history**: its `CLAUDE.md` rules, its `plan/` folder, decision inboxes, gate/checkpoint files, and a demo project with sports theming. All of that belongs to the development of the tool itself — **none of it is Kyle's game**.

- Do **not** follow this repo's `CLAUDE.md` process rules. They governed building Courtside, not using it.
- Do **not** check or act on `plan/decisions-inbox/` — any decisions there are about the tool's own build.
- Do **not** treat the demo project or its theme as the game. Kyle's game starts from zero, today, and is whatever **he** tells you it is.

Your only instructions are this file and Kyle.

## Where you're going

By the end of setup, Kyle has: a project folder with his design doc in it · Courtside watching that folder · Claude Code connected as the agent · a one-command way to start the board · a bookmark. Game work (turning the GDD into a plan, building in Godot) starts only after he says go.

---

## Step 1 — Check the basics

Run these now and report each result in one line:

```bash
node -v          # need v24 or higher
claude --version
```

Godot is a desktop app and usually not on the command line — check the Applications folder, or ask Kyle: *"Do you have Godot installed — the blue robot icon?"*

If anything is missing, fix it before moving on: Node from nodejs.org (LTS) · Claude Code via `npm install -g @anthropic-ai/claude-code` · Godot 4.x from godotengine.org.

If Courtside itself isn't on this machine yet:

```bash
git clone https://github.com/kjeveryday/Courtside.git && cd Courtside && npm install
```

## Step 2 — Give the game its own folder

It's expected that **no project exists yet**. Ask Kyle two things: *what's the game called*, and *where does he keep projects* (Desktop is fine). Then create the folder:

```bash
mkdir -p ~/Desktop/<game-name>
```

His design doc:

- **A file** (.md or .txt)? Copy it into that folder now.
- **In Google Docs / Word / Notes?** No file needed — he'll paste it in the next step.

## Step 3 — Make the Courtside icon, then run the setup wizard

Create the double-clickable launcher (once):

```bash
node scripts/make-launcher.mjs    # from the Courtside folder
```

This puts a **Courtside** icon on the Desktop. It's the only start button Kyle ever needs: no project yet → it opens the setup wizard; project set up → it opens his board; already running → it just opens the browser.

Tell Kyle: *"Double-click Courtside on your Desktop."* The wizard opens in the browser. He fills the form, you explain each field:

| Field                            | What to enter                                                                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where does your game project live? | The folder from Step 2. After typing it, click elsewhere — Courtside confirms it found it.                                                                                                     |
| Your game's name                 | Whatever Kyle calls it.                                                                                                                                                                          |
| Tell us about your game          | If his GDD file is in the folder, pick **"I have a design doc."** Otherwise **write / paste**: a full doc (with `#` headings) lands word-for-word; a plain description gets starter sections.   |
| What engine                      | **godot** — even though no Godot project exists yet. (The green "detected ✓" only appears after Step 4; a health warning until then is normal.)                                                  |
| Connect your AI                  | Type `claude`, then click **check if it works**. Uses a tiny sliver of Claude credit, once.                                                                                                      |

Click **Set up the project ▸** — the board goes live in place, and the Courtside icon now remembers this project. Tell Kyle exactly this: *"From now on, double-click Courtside on your Desktop and your board opens. Close its little window to stop it."*

## Step 4 — Make it a Godot project

A folder becomes a Godot project when it contains a `project.godot` file. Two ways — offer both, Kyle picks:

- **You create it** (fastest): write a minimal `project.godot` in the game folder — `config_version=5` plus an `[application]` section with `config/name="<game name>"` and `config/features=PackedStringArray("4.x")` matching his Godot version. Then Kyle opens Godot → **Import** → picks the folder → it appears in his project list.
- **Kyle creates it in Godot**: open Godot → **New Project** → choose the game folder as the path (if Godot complains the folder isn't empty, use the Import route above instead).

Verify: re-run the health check (the dot in the dashboard header, or `npx courtside doctor` from the Courtside folder) — the engine line goes green. Report it.

## Step 5 — Connect the Godot MCP (optional, useful soon)

The Godot MCP gives the AI a window into the Godot editor — scenes, nodes, scripts. It matters once real building starts, so it's fine to defer.

```bash
claude mcp list    # run from the game folder
```

If no godot entry is listed, find the right Godot MCP for his setup (search the MCP registry for "godot"), add it with `claude mcp add`, and verify it shows in the list. Tell Kyle in one sentence what it does.

## Step 6 — The bookmark (optional)

The icon already opens the browser, but a bookmark is nice for when the board is already running. With the server up, have Kyle visit:

```
http://127.0.0.1:4310/
```

It forwards straight into the dashboard — no token to remember. Have him bookmark it (name it **My game board**). If it ever refuses to connect, double-click the Courtside icon first.

## Step 7 — Hand off

Finish setup by doing these, in order:

1. Run the health check one more time; translate any non-green line into plain words.
2. Tell Kyle what now exists — three short lines, no file paths.
3. Ask: *"Want me to start turning your design doc into the build plan now, or stop here?"*

The plan work — reading the GDD, proposing phases and first tasks, posting the first checkpoint — begins only on his yes.

---

## Quick reference (for Kyle, after setup)

| What                      | How                                                   |
| ------------------------- | ----------------------------------------------------- |
| Open the board            | **Double-click Courtside on the Desktop**             |
| Stop the board            | Close the little Courtside window                     |
| Bookmark (when running)   | `http://127.0.0.1:4310/`                              |
| Try the safe demo         | `npm run dev` in the Courtside folder                 |
| Start the AI on the game  | `claude` in the game folder                           |
| Catch up after a break    | **The Huddle ▸** in the header                        |
| Ask anything              | **ask ▸** in the header                               |
| Check project health      | The dot in the top-right corner                       |

## If something goes wrong

- **Bookmark says "can't connect"** — the board isn't running. Double-click the Courtside icon.
- **"Locked — token required"** — close the Courtside window, double-click the icon again.
- **`claude` not found** — `npm install -g @anthropic-ai/claude-code`, then retry.
- **Wizard appears even though setup is done** — the icon's memory file (`~/.courtside/last-project`) is missing. Restore it: one line containing the game folder's full path. (Agent: do this for Kyle — `echo "/path/to/game" > ~/.courtside/last-project`.)
- **The board shows a red error** — the plan file (`plan/state.json` in the **game** folder) is broken or missing. Fix or restore it; the board recovers on its own.

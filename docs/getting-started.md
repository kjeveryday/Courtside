# Getting started with Courtside

**For the agent reading this:** You are helping Kyle get Courtside running for his Godot game project. This is a one-time setup. Kyle is non-technical, so explain each step in plain language before you do it, and tell him what to expect. Work through the steps in order. If something is already done, skip it and say so.

---

## What you're setting up

Courtside is a local dashboard that sits between Kyle and his AI coding agent. It shows everything the agent builds, holds the plan, and gives Kyle checkpoints to approve or redirect the work. Think of it as the scoreboard — Kyle watches it from the bench and makes the calls.

By the end of this setup:
- Courtside will be pointed at Kyle's Godot game project
- His GDD (game design doc) will be connected
- Claude Code will be the connected AI agent
- The Godot MCP will let the agent interact with the Godot editor directly
- Kyle will have a bookmark that opens his dashboard with one click

---

## Before you start — check these

Run each check and tell Kyle what you find. Don't proceed if something is missing.

```bash
node -v          # needs to be v24 or higher — if not, install from nodejs.org
claude --version # needs Claude Code installed — if not: npm install -g @anthropic-ai/claude-code
godot --version  # or open Godot to confirm it's installed
```

Also ask Kyle:
- Where is his Godot project folder? (the one with `project.godot` in it)
- Does he have a GDD written anywhere? (.md, .txt, or a paste he can share)
- If not, can he describe the game in a few sentences?

---

## Step 1 — Install Courtside

If Courtside isn't already installed:

```bash
cd ~/Desktop          # or wherever makes sense for Kyle
git clone https://github.com/kjeveryday/Courtside.git
cd Courtside
npm install
```

Tell Kyle: *"This downloads Courtside and sets it up. Takes about 30 seconds. You only do this once."*

---

## Step 2 — Run the setup wizard

```bash
npm run dev:new
```

This starts a wizard in the browser. Walk Kyle through each screen:

**Where does your game project live?**
Type or paste the path to his Godot project folder — the one that contains `project.godot`. For example: `~/projects/my-game` or `/Users/kyle/projects/my-game`. After typing it, tab out of the field — Courtside will confirm it found the folder.

**Your game's name**
Whatever he calls the game. This is just a label.

**Tell us about your game**
If he has a GDD file in the folder, pick it from the list. If not, click "write / paste" and either:
- Paste the full document (if it has headings like `# Characters`, it lands verbatim)
- Or type a plain description of the game — Courtside will generate starter sections that you'll expand together in Phase 0

**What engine are you building with?**
Click **godot**. If `project.godot` was in the folder, you'll see a green "detected ✓" confirmation.

**Connect your AI (optional)**
Type: `claude`
Then click **check if it works** — Courtside will run one tiny test prompt. Tell Kyle: *"This uses a tiny sliver of Claude credit to confirm the connection. It only happens here, not every time."*

**What Courtside will set up**
Review the list — it shows exactly what files it will create and what it will leave alone. Nothing gets overwritten. Click **Set up the project ▸**.

The board goes live in place, no restart needed.

---

## Step 3 — Set up the Godot MCP in Claude Code

The Godot MCP lets Claude interact directly with the Godot editor — reading scenes, understanding node structure, and making changes. This is a Claude Code configuration, separate from Courtside.

**Check if the Godot MCP is already configured:**

```bash
claude mcp list
```

If you see a `godot` or `godot-mcp` entry, it's already connected — skip to Step 4.

**If it's not configured yet:**

The recommended Godot MCP for Claude Code is the community `godot-tools` MCP. Install and connect it:

```bash
# From inside the Godot project folder:
claude mcp add godot-tools --scope project
```

If that command isn't available or doesn't find it, help Kyle find the right MCP for his Godot version:
- Godot 4.x: search for `godot-mcp` or `godot4-mcp` in the Claude MCP registry
- Or visit the Godot project's GitHub and follow their MCP setup instructions

Once added, verify with `claude mcp list` — you should see it active.

Tell Kyle: *"The Godot MCP is what lets the AI actually see and work inside your Godot project — it's like giving the agent a window into the editor."*

---

## Step 4 — Add the bookmark

The bookmark URL is always the same, regardless of which session token is active:

```
http://127.0.0.1:4310/
```

**To add it in Chrome or Safari:**
1. Make sure Courtside is running (the terminal where you ran `npm run dev:new` or `npm run dev` should still be open)
2. Visit `http://127.0.0.1:4310/` — it auto-redirects to the dashboard
3. Star / bookmark the page. Name it **Courtside** or **My Game Dashboard**

Tell Kyle: *"Any time you want to check in on your game — open this bookmark. If the page doesn't load, you'll need to start the server first with `npm run dev` in the Courtside folder."*

---

## Step 5 — First session

Now that everything is connected, here's what a typical work session looks like:

**Starting a session:**
1. Open a terminal in the Courtside folder and run `npm run dev:self` (or `npm run dev` for the demo)
2. Open the bookmark — the dashboard loads
3. Check The Huddle (top right) — it tells you what happened since you last looked

**When the AI builds something:**
The agent writes a plan as it works. When it hits a checkpoint, it stops and the board shows a checkpoint card. Kyle:
1. Reads the TL;DR (◇ = the AI's own summary)
2. Checks off the verify steps
3. Clicks **Approve checkpoint** (or requests changes)

The decision is logged and the agent picks it up next session.

**Starting the agent:**
With Claude Code connected, Kyle can click **ask the AI ▸** on any task or question to dispatch work directly from the board. Or he can run `claude` in his project folder to start a full session — the agent will read the plan and pick up where it left off.

---

## Quick reference (after setup)

| What                        | How                                           |
| --------------------------- | --------------------------------------------- |
| Open the dashboard          | Bookmark → `http://127.0.0.1:4310/`           |
| Start the server            | `npm run dev:self` in the Courtside folder     |
| Start from scratch (demo)   | `npm run dev` in the Courtside folder          |
| Set up a new project        | `npm run dev:new` in the Courtside folder      |
| Start the AI agent          | `claude` in the game project folder            |
| Check project health        | Click the dot in the top-right of the dashboard|
| Get caught up after a break | Click **The Huddle ▸** in the header           |
| Ask a question              | Click **ask ▸** in the header                  |

---

## If something goes wrong

**"Connection refused" when opening the bookmark:**
The Courtside server isn't running. Open a terminal in the Courtside folder and run `npm run dev:self`.

**"Locked — token required":**
Restart the server. The bookmark auto-redirects with the new token.

**Agent command check failed:**
Make sure `claude` is installed globally: `npm install -g @anthropic-ai/claude-code`. Then try `claude --version` in the terminal.

**Godot MCP not found:**
Run `claude mcp list` from inside the game project folder. The MCP scope matters — if it was added with `--scope project`, it only appears inside that folder.

**The board shows a red error:**
The plan file has invalid JSON or is missing. Check that `plan/state.json` exists in the project folder. The board recovers automatically when the file is fixed.

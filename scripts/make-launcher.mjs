// Writes the double-clickable Courtside launcher to the Desktop. One icon, one
// behavior: your board if a project is set up (~/.courtside/last-project, written
// by the wizard), the setup wizard if not. Already running? It just opens the
// browser. Re-run any time — this repo's path is baked in at write time.
import { chmodSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const dest = join(homedir(), 'Desktop', 'Courtside.command');

const script = `#!/bin/zsh
# Courtside — double-click to open your board. Close this window to stop it.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "${repo}" || exit 1

URL="http://127.0.0.1:4310/"
if curl -s -o /dev/null --max-time 1 "$URL"; then
  [ -z "$COURTSIDE_LAUNCHER_NO_OPEN" ] && open "$URL"
  echo "Courtside is already running — opened your board."
  exit 0
fi

PROJECT="$(cat "$HOME/.courtside/last-project" 2>/dev/null)"
if [ -n "$PROJECT" ] && [ -f "$PROJECT/plan/state.json" ]; then
  export COURTSIDE_PLAN_DIR="$PROJECT/plan"
  echo "Opening your board: $PROJECT"
else
  export COURTSIDE_PLAN_DIR=".sandbox/new-game/plan"
  echo "No project set up yet — opening the setup wizard."
fi

if [ -z "$COURTSIDE_LAUNCHER_NO_OPEN" ]; then
  ( for i in {1..120}; do
      sleep 0.5
      curl -s -o /dev/null --max-time 1 "$URL" && { open "$URL"; exit 0; }
    done ) &
fi
exec node scripts/dev.mjs
`;

writeFileSync(dest, script);
chmodSync(dest, 0o755);
console.log(`Launcher written: ${dest}`);
console.log('Double-click "Courtside" on the Desktop to start.');

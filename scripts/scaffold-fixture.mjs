// Builds the harness fixture project (AD-5): a consuming-repo-shaped plan dir.
// state.json is generated from the committed seed (single source, zero drift);
// committed companions (tape frame, artifact log, gate payload) live alongside.
// Server-written paths (decisions-inbox/, decisions.md) are created empty.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const seed = new URL('../spec/fixtures/state.sample.json', import.meta.url);
const planDir = new URL('../spec/fixtures/sample-project/plan/', import.meta.url);

// Full demo reset on every boot: state from seed, decision artifacts cleared —
// each `npm run dev` starts the story at "gate pending, your call".
rmSync(new URL('decisions-inbox/', planDir), { recursive: true, force: true });
rmSync(new URL('decisions.md', planDir), { force: true });
for (const sub of ['', 'gates', 'tape/TASK-12', 'artifacts', 'decisions-inbox']) {
  mkdirSync(new URL(sub, planDir), { recursive: true });
}
copyFileSync(seed, new URL('state.json', planDir));
console.log(`Fixture project reset at ${fileURLToPath(planDir)} (state.json from seed).`);

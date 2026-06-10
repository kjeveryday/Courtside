// Builds the harness fixture project (AD-5): a consuming-repo-shaped plan dir.
// state.json is generated from the committed seed (single source, zero drift);
// committed companions (tape frame, artifact log, gate payload) live alongside.
// Server-written paths (decisions-inbox/, decisions.md) are created empty.
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const seed = new URL('../spec/fixtures/state.sample.json', import.meta.url);
const planDir = new URL('../spec/fixtures/sample-project/plan/', import.meta.url);

for (const sub of ['', 'gates', 'tape/TASK-12', 'artifacts', 'decisions-inbox']) {
  mkdirSync(new URL(sub, planDir), { recursive: true });
}
copyFileSync(seed, new URL('state.json', planDir));
console.log(`Fixture project ready at ${fileURLToPath(planDir)} (state.json from seed).`);

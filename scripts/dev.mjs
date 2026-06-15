// Harness boot (AD-8): build the UI, then serve. Default: the demo fixture
// (scaffolded fresh each boot). COURTSIDE_PLAN_DIR overrides — `npm run dev:self`
// points the dashboard at this repo's own plan (the real project).
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
console.log('Building UI (vite build)…');
execSync('npx vite build --logLevel warn', { cwd: root, stdio: 'inherit' });

let planDir = process.env.COURTSIDE_PLAN_DIR && resolve(root, process.env.COURTSIDE_PLAN_DIR);
if (!planDir) {
  await import('./scaffold-fixture.mjs');
  planDir = fileURLToPath(new URL('../spec/fixtures/sample-project/plan', import.meta.url));
}

const { startServer } = await import('../src/server/main.ts');
await startServer({ planDir, port: 4310, announce: true });

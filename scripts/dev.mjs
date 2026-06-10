// Harness boot (AD-8): build the UI, scaffold the fixture project, start the real
// Courtside server on 127.0.0.1:4310 against it. One command, real code paths.
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
console.log('Building UI (vite build)…');
execSync('npx vite build --logLevel warn', { cwd: root, stdio: 'inherit' });
await import('./scaffold-fixture.mjs');

const { startServer } = await import('../src/server/main.ts');
const planDir = fileURLToPath(new URL('../spec/fixtures/sample-project/plan', import.meta.url));
await startServer({ planDir, port: 4310, announce: true });

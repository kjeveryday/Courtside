// vitest globalSetup: fixture-dependent tests (doctor, lint, tape) need the
// sample-project plan dir, whose state.json is generated (gitignored, AD-5).
// Scaffolding here keeps a fresh clone's `npm test` green.
export default async function setup() {
  await import('./scaffold-fixture.mjs');
}

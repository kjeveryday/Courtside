#!/usr/bin/env node
// Thin launcher: Node 24 runs the TypeScript CLI natively (AD-2).
const { cli } = await import('../src/cli/main.ts');
const code = await cli(process.argv.slice(2));
if (code >= 0) process.exit(code);

// Contract codegen (CLAUDE.md rule 13): spec/state.schema.json is the only source
// of truth; this script writes src/contract/state.generated.ts from it.
// `--check` mode regenerates in memory and fails if the committed file drifts —
// wired into `npm run check` so a hand-edited or stale type can never land.
import { readFileSync, writeFileSync } from 'node:fs';
import { compile } from 'json-schema-to-typescript';

const SCHEMA_PATH = new URL('../spec/state.schema.json', import.meta.url);
const OUTPUT_PATH = new URL('../src/contract/state.generated.ts', import.meta.url);

const banner = `/* GENERATED — do not edit. Source of truth: spec/state.schema.json.
 * Regenerate with \`npm run codegen\`; \`npm run check\` fails on drift (rule 13). */`;

async function generate() {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  // The schema's human title ("Courtside state contract v0") would become the TS
  // type name; override in memory only, so code gets the intended `CourtsideState`.
  schema.title = 'CourtsideState';
  return compile(schema, 'CourtsideState', {
    bannerComment: banner,
    additionalProperties: false,
    style: { singleQuote: true, trailingComma: 'all', printWidth: 100 },
  });
}

const generated = await generate();

if (process.argv.includes('--check')) {
  let committed = '';
  try {
    committed = readFileSync(OUTPUT_PATH, 'utf-8');
  } catch {
    console.error('codegen check FAILED: src/contract/state.generated.ts is missing.');
    console.error('Fix: run `npm run codegen` and commit the result.');
    process.exit(1);
  }
  if (committed !== generated) {
    console.error('codegen check FAILED: state.generated.ts drifted from the schema.');
    console.error('Fix: run `npm run codegen` and commit the result. Never hand-edit it.');
    process.exit(1);
  }
  console.log('codegen check OK: generated types match the schema.');
} else {
  writeFileSync(OUTPUT_PATH, generated);
  console.log('Wrote src/contract/state.generated.ts from spec/state.schema.json.');
}

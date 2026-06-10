// Contract codegen (CLAUDE.md rule 13): spec/state.schema.json is the only source
// of truth; this script writes src/contract/state.generated.ts from it.
// `--check` mode regenerates in memory and fails if the committed file drifts —
// wired into `npm run check` so a hand-edited or stale type can never land.
import { readFileSync, writeFileSync } from 'node:fs';
import { compile } from 'json-schema-to-typescript';

const SCHEMA_PATH = new URL('../spec/state.schema.json', import.meta.url);
const OUTPUT_PATH = new URL('../src/contract/state.generated.ts', import.meta.url);
const SCHEMA_TS_PATH = new URL('../src/contract/schema.generated.ts', import.meta.url);

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

// Second artifact (AD-7): the schema itself as a TS const, so node/vite/vitest all
// import it with identical semantics (no JSON import-attribute divergence).
function generateSchemaTs() {
  const raw = readFileSync(SCHEMA_PATH, 'utf-8');
  return `${banner}\nexport const stateSchema = ${raw.trim()} as const;\n`;
}

const outputs = [
  { path: OUTPUT_PATH, label: 'state.generated.ts', content: await generate() },
  { path: SCHEMA_TS_PATH, label: 'schema.generated.ts', content: generateSchemaTs() },
];

if (process.argv.includes('--check')) {
  for (const { path, label, content } of outputs) {
    let committed = '';
    try {
      committed = readFileSync(path, 'utf-8');
    } catch {
      console.error(`codegen check FAILED: ${label} is missing. Fix: npm run codegen + commit.`);
      process.exit(1);
    }
    if (committed !== content) {
      console.error(`codegen check FAILED: ${label} drifted from the schema.`);
      console.error('Fix: run `npm run codegen` and commit the result. Never hand-edit it.');
      process.exit(1);
    }
  }
  console.log('codegen check OK: generated types match the schema.');
} else {
  for (const { path, label, content } of outputs) {
    writeFileSync(path, content);
    console.log(`Wrote ${label} from spec/state.schema.json.`);
  }
}

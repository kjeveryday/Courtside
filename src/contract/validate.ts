// Runtime gate for the contract: everything entering the app goes through here as
// `unknown` and comes out either a typed CourtsideState or a list of errors.
// No partial acceptance (PRD §5 — invalid state never renders as truth).
import AjvImport from 'ajv';
import addFormatsImport from 'ajv-formats';
import { stateSchema } from './schema.generated.ts';
import type { CourtsideState } from './state.generated.ts';

// ajv ships CJS; default-import interop differs between bundlers and native node
// ESM (AD-2 runs this file in both). Normalize once here.
const Ajv = (AjvImport as unknown as { default?: typeof AjvImport }).default ?? AjvImport;
const addFormats =
  (addFormatsImport as unknown as { default?: typeof addFormatsImport }).default ??
  addFormatsImport;

export type ValidationResult =
  | { ok: true; state: CourtsideState }
  | { ok: false; errors: string[] };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateFn = ajv.compile<CourtsideState>(stateSchema);

export function validateState(data: unknown): ValidationResult {
  if (validateFn(data)) return { ok: true, state: data };
  const errors = (validateFn.errors ?? []).map(
    (e) => `${e.instancePath || '/'} — ${e.message ?? 'invalid'}`,
  );
  return { ok: false, errors: errors.length > 0 ? errors : ['/ — invalid state'] };
}

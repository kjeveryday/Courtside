// Runtime gate for the contract: everything entering the app goes through here as
// `unknown` and comes out either a typed CourtsideState or a list of errors.
// No partial acceptance (PRD §5 — invalid state never renders as truth).
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import schema from '../../spec/state.schema.json';
import type { CourtsideState } from './state.generated';

export type ValidationResult =
  | { ok: true; state: CourtsideState }
  | { ok: false; errors: string[] };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateFn = ajv.compile<CourtsideState>(schema);

export function validateState(data: unknown): ValidationResult {
  if (validateFn(data)) return { ok: true, state: data };
  const errors = (validateFn.errors ?? []).map(
    (e) => `${e.instancePath || '/'} — ${e.message ?? 'invalid'}`,
  );
  return { ok: false, errors: errors.length > 0 ? errors : ['/ — invalid state'] };
}

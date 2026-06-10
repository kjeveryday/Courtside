// Read + validate the plan dir's state.json through the shared contract module.
// Invalid or unreadable state yields errors, never partial data (PRD §5).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateState, type ValidationResult } from '../contract/validate.ts';

export function readState(planDir: string): ValidationResult {
  let raw: string;
  try {
    raw = readFileSync(join(planDir, 'state.json'), 'utf-8');
  } catch (err) {
    return { ok: false, errors: [`state.json — unreadable: ${(err as Error).message}`] };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { ok: false, errors: [`state.json — not valid JSON: ${(err as Error).message}`] };
  }
  return validateState(data);
}

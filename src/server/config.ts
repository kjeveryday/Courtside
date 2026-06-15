// Plan-dir resolution (AD-8 precedence). Pure for T16: existence is injected.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURE_PLAN = join('spec', 'fixtures', 'sample-project', 'plan');

export function resolvePlanDir(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  cwd: string,
  exists: (p: string) => boolean = existsSync,
): string {
  const flagIdx = argv.indexOf('--plan-dir');
  const flagged = flagIdx >= 0 ? argv[flagIdx + 1] : undefined;
  if (flagged) return flagged;
  if (env.COURTSIDE_PLAN_DIR) return env.COURTSIDE_PLAN_DIR;
  const local = join(cwd, 'plan');
  if (exists(join(local, 'state.json'))) return local;
  const fixture = join(cwd, FIXTURE_PLAN);
  if (exists(join(fixture, 'state.json'))) return fixture;
  throw new Error(
    'No plan directory found. Pass --plan-dir <path>, set COURTSIDE_PLAN_DIR, ' +
      'or run in a repo whose ./plan contains state.json.',
  );
}

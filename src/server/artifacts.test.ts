// T37 (TASK-28): the evidence route is confined — plan files with safe
// extensions only, both ref spellings, nothing hidden, no escape.
import { describe, expect, it } from 'vitest';
import { safeArtifactPath } from './artifacts.ts';

const planDir = new URL('../../spec/fixtures/sample-project/plan', import.meta.url).pathname;

describe('safeArtifactPath (T37)', () => {
  it('resolves plan-relative and repo-relative refs to the same file', () => {
    expect(safeArtifactPath(planDir, '/api/artifact/artifacts/gut-run-0610-1941.log')).toContain(
      'plan/artifacts/gut-run-0610-1941.log',
    );
    expect(
      safeArtifactPath(planDir, '/api/artifact/plan/artifacts/gut-run-0610-1941.log'),
    ).toContain('plan/artifacts/gut-run-0610-1941.log');
    expect(safeArtifactPath(planDir, '/api/artifact/decisions-inbox/G5-TASK-11.json')).toContain(
      'decisions-inbox/G5-TASK-11.json',
    );
  });
  it('refuses traversal, hidden paths, and unlisted extensions', () => {
    expect(safeArtifactPath(planDir, '/api/artifact/../secret.log')).toBeUndefined();
    expect(safeArtifactPath(planDir, '/api/artifact/..%2f..%2fx.log')).toBeUndefined();
    expect(safeArtifactPath(planDir, '/api/artifact/.hidden/x.log')).toBeUndefined();
    expect(safeArtifactPath(planDir, '/api/artifact/artifacts/run.sh')).toBeUndefined();
    expect(safeArtifactPath(planDir, '/api/artifact/artifacts/x')).toBeUndefined();
  });
});

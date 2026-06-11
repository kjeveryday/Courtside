// T34 (DEC-30): doc route confinement — project .md files only, nothing else.
import { describe, expect, it } from 'vitest';
import { safeDocPath } from './docs.ts';

const planDir = new URL('../../spec/fixtures/sample-project/plan', import.meta.url).pathname;

describe('safeDocPath (T34)', () => {
  it('serves .md files under the project root (plan dir parent)', () => {
    expect(safeDocPath(planDir, '/api/doc/gdd.md')).toContain('sample-project/gdd.md');
  });
  it('serves plan/*.md too — specs and reports are source docs (TASK-28)', () => {
    expect(safeDocPath(planDir, '/api/doc/plan/specs/battle-core.md')).toContain(
      'plan/specs/battle-core.md',
    );
  });
  it('refuses traversal, non-markdown, hidden paths, and node_modules', () => {
    expect(safeDocPath(planDir, '/api/doc/../../state.schema.json')).toBeUndefined();
    expect(safeDocPath(planDir, '/api/doc/plan/state.json')).toBeUndefined();
    expect(safeDocPath(planDir, '/api/doc/.courtside/secret')).toBeUndefined();
    expect(safeDocPath(planDir, '/api/doc/plan/.hidden/x.md')).toBeUndefined();
    expect(safeDocPath(planDir, '/api/doc/node_modules/x/README.md')).toBeUndefined();
    expect(safeDocPath(planDir, '/api/doc/..%2f..%2fsecret.md')).toBeUndefined();
  });
});

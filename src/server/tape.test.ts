// T28 (specs/tape-and-huddle.md B1): tape resolution facts + traversal safety.
import { describe, expect, it } from 'vitest';
import { resolveTape, safeTapePath } from './tape.ts';

const planDir = new URL('../../spec/fixtures/sample-project/plan', import.meta.url).pathname;

describe('resolveTape (T28)', () => {
  it('reports existing frame with mtime and missing frame as unverifiable', () => {
    const frames = resolveTape(planDir, [
      'plan/tape/TASK-12/frame-001.png',
      'plan/tape/TASK-12/frame-002.png',
    ]);
    expect(frames[0]!.exists).toBe(true);
    expect(frames[0]!.mtime).toBeTruthy();
    expect(frames[0]!.size).toBeGreaterThan(0);
    expect(frames[1]!.exists).toBe(false);
    expect(frames[1]!.mtime).toBeUndefined();
  });
});

describe('safeTapePath (T28b)', () => {
  it('confines requests to the tape dir', () => {
    expect(safeTapePath(planDir, '/api/tape/TASK-12/frame-001.png')).toContain('/tape/TASK-12/');
    expect(safeTapePath(planDir, '/api/tape/../state.json')).toBeUndefined();
    expect(safeTapePath(planDir, '/api/tape/..%2fstate.json')).toBeUndefined();
  });
});

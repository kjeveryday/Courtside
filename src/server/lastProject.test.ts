// T46: the launcher pointer — what makes the desktop icon open the right
// project after a restart (the minimal durable fix for the D-5 gap).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { lastProjectFile, readLastProject, writeLastProject } from './lastProject.ts';

const base = mkdtempSync(join(tmpdir(), 'cs-lastproj-'));
afterAll(() => rmSync(base, { recursive: true, force: true }));

describe('launcher pointer (T46)', () => {
  it('missing file reads as undefined, never an error', () => {
    expect(readLastProject(base)).toBeUndefined();
  });

  it('round-trips the project root the setup wrote', () => {
    const file = writeLastProject('/Users/someone/Desktop/my-game', base);
    expect(file).toBe(lastProjectFile(base));
    expect(readLastProject(base)).toBe('/Users/someone/Desktop/my-game');
  });
});

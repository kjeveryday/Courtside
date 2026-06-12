// T26/T27 (specs/pre-game.md B1) — doctor against this very repo + fixture.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkNodeVersion, runDoctor } from './doctor.ts';
import { writeProjectConfig } from './projectConfig.ts';

const repoRoot = new URL('../../', import.meta.url).pathname;
const planDir = new URL('../../spec/fixtures/sample-project/plan', import.meta.url).pathname;
const runtimeDir = new URL('../../.courtside', import.meta.url).pathname;

describe('runDoctor (T26)', () => {
  it('this repo + fixture has zero failing checks (warn/skip allowed)', () => {
    const findings = runDoctor({ repoRoot, planDir, runtimeDir });
    expect(findings.filter((f) => f.status === 'fail')).toEqual([]);
    // honesty checks: deferred items must be visible, not hidden
    expect(findings.some((f) => f.id === 'mcp' && f.status === 'skip')).toBe(true);
    expect(findings.some((f) => f.id === 'engine' && f.status === 'skip')).toBe(true);
    expect(findings.some((f) => f.id === 'state-valid' && f.status === 'pass')).toBe(true);
  });
});

describe('engine check from config (TASK-31)', () => {
  it('godot in config: warn without project.godot, pass with it', () => {
    const proj = mkdtempSync(join(tmpdir(), 'courtside-doc-'));
    writeProjectConfig(proj, { project: 'X', engine: 'godot' });
    const ctx = { repoRoot: proj, planDir: join(proj, 'plan'), runtimeDir: join(proj, '.c') };
    expect(runDoctor(ctx).find((f) => f.id === 'engine')?.status).toBe('warn');
    writeFileSync(join(proj, 'project.godot'), '');
    expect(runDoctor(ctx).find((f) => f.id === 'engine')?.status).toBe('pass');
    expect(runDoctor(ctx).find((f) => f.id === 'config')?.detail).toContain('engine godot');
    rmSync(proj, { recursive: true, force: true });
  });
});

describe('checkNodeVersion (T27)', () => {
  it('passes at/above the floor, fails below', () => {
    expect(checkNodeVersion('v24.15.0', 24).status).toBe('pass');
    expect(checkNodeVersion('v24.0.0', 24).status).toBe('pass');
    expect(checkNodeVersion('v22.5.0', 24).status).toBe('fail');
    expect(checkNodeVersion('v18.1.0', 24).status).toBe('fail');
  });
});

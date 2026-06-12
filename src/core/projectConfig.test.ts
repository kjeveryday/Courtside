// T41 (TASK-31): the durable config — round-trip, precedence, and a corrupt
// file degrading to "no config" instead of an exception.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readProjectConfig, resolveAgentCmd, writeProjectConfig } from './projectConfig.ts';

const tmp = mkdtempSync(join(tmpdir(), 'courtside-cfg-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('projectConfig (T41)', () => {
  it('round-trips and stamps the schema', () => {
    writeProjectConfig(tmp, { project: 'Hoops', engine: 'godot', agentCmd: 'claude' });
    const cfg = readProjectConfig(tmp);
    expect(cfg?.schema).toBe('courtside/config-v0');
    expect(cfg?.project).toBe('Hoops');
    expect(cfg?.engine).toBe('godot');
  });
  it('agent command precedence: override > env > config > nothing', () => {
    const cfg = { agentCmd: 'from-config' };
    expect(resolveAgentCmd('override', 'env', cfg)).toBe('override');
    expect(resolveAgentCmd(undefined, 'env', cfg)).toBe('env');
    expect(resolveAgentCmd(undefined, undefined, cfg)).toBe('from-config');
    expect(resolveAgentCmd(undefined, undefined, undefined)).toBeUndefined();
  });
  it('a corrupt config reads as no config', () => {
    const broken = mkdtempSync(join(tmpdir(), 'courtside-cfg-bad-'));
    writeFileSync(join(broken, 'courtside.config.json'), '{ nope');
    expect(readProjectConfig(broken)).toBeUndefined();
    rmSync(broken, { recursive: true, force: true });
  });
});

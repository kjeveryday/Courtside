// T21 (specs/the-gate.md B1) — chain integrity: any edit, removal, or reorder breaks.
import { describe, expect, it } from 'vitest';
import { signEntry, verifyChain, type ChainEntry, type DecisionBody } from './signing.ts';

const secret = 'a'.repeat(64);

function buildChain(): ChainEntry[] {
  const entries: ChainEntry[] = [];
  let prevMac = '';
  for (let seq = 1; seq <= 3; seq++) {
    const body: DecisionBody = {
      seq,
      ts: `2026-06-10T0${seq}:00:00Z`,
      gateId: `G5-TASK-${seq}`,
      decision: 'approve',
      comment: '',
      steps: [],
    };
    const mac = signEntry(secret, body, prevMac);
    entries.push({ ...body, prevMac, mac });
    prevMac = mac;
  }
  return entries;
}

describe('decision chain (T21)', () => {
  it('verifies an intact chain', () => {
    expect(verifyChain(secret, buildChain())).toEqual({ ok: true });
  });
  it('detects edited content', () => {
    const chain = buildChain();
    chain[1] = { ...chain[1]!, decision: 'reject' };
    const res = verifyChain(secret, chain);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.brokenAt).toBe(2);
  });
  it('detects removal and reorder', () => {
    const chain = buildChain();
    expect(verifyChain(secret, [chain[0]!, chain[2]!]).ok).toBe(false);
    expect(verifyChain(secret, [chain[1]!, chain[0]!, chain[2]!]).ok).toBe(false);
  });
  it('rejects a chain signed with a different secret', () => {
    expect(verifyChain('b'.repeat(64), buildChain()).ok).toBe(false);
  });
  it('empty chain is trivially ok', () => {
    expect(verifyChain(secret, []).ok).toBe(true);
  });
});

// T15 (specs/live-wire.md B2): token compare is constant-time-shaped and strict.
import { describe, expect, it } from 'vitest';
import { extractToken, generateToken, tokenEquals } from './auth.ts';

describe('tokenEquals (T15)', () => {
  it('accepts only the exact token', () => {
    const t = generateToken();
    expect(tokenEquals(t, t)).toBe(true);
    expect(tokenEquals(t, t.slice(0, -1) + 'x')).toBe(false);
    expect(tokenEquals(t, t + 'a')).toBe(false); // length mismatch
    expect(tokenEquals(t, '')).toBe(false);
    expect(tokenEquals(t, undefined)).toBe(false);
    expect(tokenEquals(t, null)).toBe(false);
  });
  it('generates 32-hex tokens, unique per call', () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{32}$/);
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe('extractToken (T15b)', () => {
  it('reads Bearer header first, then ?token=', () => {
    expect(extractToken('Bearer abc', '/api/state')).toBe('abc');
    expect(extractToken(undefined, '/api/state?token=qry')).toBe('qry');
    expect(extractToken('Bearer abc', '/?token=qry')).toBe('abc');
    expect(extractToken(undefined, '/api/state')).toBeUndefined();
    expect(extractToken('Basic abc', '/api/state')).toBeUndefined();
  });
});

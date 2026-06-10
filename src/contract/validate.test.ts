// T1–T6 from specs/walking-skeleton.md §B5: the fixture must validate; broken
// variants must fail with path-bearing errors and never throw.
import { describe, expect, it } from 'vitest';
// The actual shipped fixture file — the import keeps the test pinned to it.
import fixtureJson from '../../spec/fixtures/state.sample.json';
import { validateState } from './validate';

// Loosest honest shape the mutation tests need (fields optional so `delete` is
// legal); production code only ever sees `unknown`.
type LooseState = {
  agent?: Record<string, unknown>;
  tasks?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

// Two-step cast: the inferred JSON literal type has no index signature.
const loadFixture = (): LooseState => structuredClone(fixtureJson) as unknown as LooseState;

describe('validateState (contract v0)', () => {
  it('T1: the shipped fixture validates', () => {
    const result = validateState(loadFixture());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.schema).toBe('courtside/v0');
  });

  it('T2: missing required key (agent) fails, naming the key', () => {
    const fixture = loadFixture();
    delete fixture.agent;
    const result = validateState(fixture);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('agent');
  });

  it('T3: bad enum (agent.state = "napping") fails at /agent/state', () => {
    const fixture = loadFixture();
    fixture.agent!.state = 'napping';
    const result = validateState(fixture);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('/agent/state');
  });

  it('T4: bad pattern (task id "T-12") fails at /tasks/0/id', () => {
    const fixture = loadFixture();
    fixture.tasks![0]!.id = 'T-12';
    const result = validateState(fixture);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('/tasks/0/id');
  });

  it('T5: unknown top-level key fails (contract is closed)', () => {
    const fixture = loadFixture();
    fixture.unexpectedKey = 1;
    const result = validateState(fixture);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('additional');
  });

  it('T6: non-object input fails without throwing', () => {
    for (const input of [null, 'hi', 42, undefined, []]) {
      const result = validateState(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

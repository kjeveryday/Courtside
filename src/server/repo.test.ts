// T38 (TASK-29): remote-url parsing — both spellings normalize to a browsable
// https URL; no origin (or an unrecognized one) yields no link, never a guess.
import { describe, expect, it } from 'vitest';
import { originUrlFromConfig } from './repo.ts';

describe('originUrlFromConfig (T38)', () => {
  it('normalizes ssh and https origins, stripping .git', () => {
    expect(
      originUrlFromConfig('[remote "origin"]\n\turl = git@github.com:kj/Courtside.git\n'),
    ).toBe('https://github.com/kj/Courtside');
    expect(
      originUrlFromConfig('[remote "origin"]\n\turl = https://github.com/kj/Courtside.git\n'),
    ).toBe('https://github.com/kj/Courtside');
    expect(
      originUrlFromConfig('[remote "origin"]\n\turl = https://github.com/kj/Courtside\n'),
    ).toBe('https://github.com/kj/Courtside');
  });
  it('ignores other remotes and unrecognized urls', () => {
    expect(
      originUrlFromConfig('[remote "upstream"]\n\turl = https://x.test/a/b\n'),
    ).toBeUndefined();
    expect(
      originUrlFromConfig('[remote "origin"]\n\turl = file:///some/local/path\n'),
    ).toBeUndefined();
    expect(originUrlFromConfig('[core]\n\tbare = false\n')).toBeUndefined();
  });
});

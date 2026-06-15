// `courtside` CLI (DEC-5: repo-local bin): doctor (default) · lint · dev.
// Same check engine as the UI — one implementation, two surfaces (F0).
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolvePlanDir } from '../server/config.ts';
import { lintPlan } from '../core/lint.ts';
import { runDoctor } from '../core/doctor.ts';
import { readProjectConfig, resolveAgentCmd } from '../core/projectConfig.ts';

const ICONS = { pass: '✓', warn: '!', fail: '✗', skip: '–' } as const;

export async function cli(argv: string[]): Promise<number> {
  const cmd = argv.find((a) => !a.startsWith('-')) ?? 'doctor';
  const repoRoot = process.cwd();
  let planDir: string;
  try {
    planDir = resolvePlanDir(argv, process.env, repoRoot);
  } catch (err) {
    // Safe auto-fix per PRD F0 (scaffolding is reversible): a fresh clone has the
    // fixture seed but not the generated sample-project plan — build it and retry.
    if (existsSync(`${repoRoot}/spec/fixtures/state.sample.json`)) {
      // @ts-expect-error — side-effect import of the plain-JS scaffold script
      await import('../../scripts/scaffold-fixture.mjs');
      try {
        planDir = resolvePlanDir(argv, process.env, repoRoot);
      } catch {
        console.error((err as Error).message);
        return 1;
      }
    } else {
      console.error((err as Error).message);
      return 1;
    }
  }
  // Same isolation rule as the server: runtime state sits next to the plan it
  // belongs to, so checking the demo never reads (or risks) the real chain.
  const runtimeDir = join(dirname(planDir), '.courtside');

  if (cmd === 'dev') {
    // @ts-expect-error — side-effect import of the plain-JS boot script (AD-2);
    // typing it adds nothing, it only runs.
    await import('../../scripts/dev.mjs');
    return -1; // long-running; never resolves to an exit
  }

  if (cmd === 'lint') {
    const findings = lintPlan(planDir, runtimeDir);
    for (const l of findings)
      console.log(`${ICONS[l.level === 'pass' ? 'pass' : l.level]} ${l.text}`);
    return findings.some((l) => l.level === 'fail') ? 1 : 0;
  }

  if (cmd === 'doctor') {
    const findings = runDoctor({
      repoRoot,
      planDir,
      runtimeDir,
      agentCmd: resolveAgentCmd(
        undefined,
        process.env.COURTSIDE_AGENT_CMD,
        readProjectConfig(dirname(planDir)),
      ),
    });
    let category = '';
    for (const f of findings) {
      if (f.category !== category) {
        category = f.category;
        console.log(`\n${category.toUpperCase()}`);
      }
      console.log(
        `  ${ICONS[f.status]} ${f.id} — ${f.detail}${
          f.fixit && f.status !== 'pass' ? `\n      fix: ${f.fixit}` : ''
        }`,
      );
    }
    const fails = findings.filter((f) => f.status === 'fail').length;
    const warns = findings.filter((f) => f.status === 'warn').length;
    console.log(
      fails > 0
        ? `\ndoctor: ${fails} failing — fix the lines above`
        : `\ndoctor: all green${warns > 0 ? ` · ${warns} warning${warns > 1 ? 's' : ''}` : ''}`,
    );
    return fails > 0 ? 1 : 0;
  }

  console.error(`unknown command: ${cmd} (try doctor | lint | dev)`);
  return 1;
}

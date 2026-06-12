// Pre-game setup (TASK-31, DEC-37): stands up an EMPTY project from a few
// answers. Hard rules: only runs when plan/state.json is absent; never
// overwrites an existing file (existing work is reported as kept, not
// replaced); every write is confined to the project root; the fresh state is
// contract-validated before it touches disk.
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { validateState } from '../contract/validate.ts';
import { writeProjectConfig } from '../core/projectConfig.ts';
import { claudeMdStarter, freshState, gddFromDescription } from './templates.ts';

export type SetupInfo = {
  projectName: string;
  mdFiles: string[]; // candidate design docs (project root + docs/, relative)
  hasProjectGodot: boolean;
  hasClaudeMd: boolean;
  hasFrameworkDoc: boolean;
};

const listMd = (dir: string, prefix: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.'))
        .map((e) => (prefix ? `${prefix}/${e.name}` : e.name))
    : [];

export function setupInfo(planDir: string): SetupInfo {
  const root = dirname(planDir);
  return {
    projectName: basename(root),
    mdFiles: [...listMd(root, ''), ...listMd(join(root, 'docs'), 'docs')],
    hasProjectGodot: existsSync(join(root, 'project.godot')),
    hasClaudeMd: existsSync(join(root, 'CLAUDE.md')),
    hasFrameworkDoc: existsSync(join(root, 'docs', 'framework-v2.md')),
  };
}

export type SetupOutcome = { status: 200 | 400 | 409; payload: unknown };

export function runSetup(opts: {
  planDir: string;
  courtsideRoot: string;
  answers: Record<string, unknown>;
}): SetupOutcome {
  const { planDir, courtsideRoot, answers } = opts;
  const root = dirname(planDir);
  const bad = (error: string): SetupOutcome => ({ status: 400, payload: { error } });
  if (existsSync(join(planDir, 'state.json')))
    return { status: 409, payload: { error: 'already set up — this project has a plan' } };

  const str = (k: string, max: number) =>
    typeof answers[k] === 'string' ? (answers[k] as string).trim().slice(0, max) : '';
  const projectName = str('projectName', 80) || basename(root);
  const gddMode = str('gddMode', 16);
  const engine = str('engine', 16);
  const agentCmd = str('agentCmd', 200);
  if (!['have', 'paste', 'describe'].includes(gddMode))
    return bad('gddMode must be have | paste | describe');
  if (engine && !['godot', 'unity', 'none'].includes(engine))
    return bad('engine must be godot | unity | none');

  const written: string[] = [];
  const kept: string[] = [];

  // design doc — three honest paths, no overwrites
  let gddRel = 'gdd.md';
  if (gddMode === 'have') {
    gddRel = str('gddPath', 200);
    if (!setupInfo(planDir).mdFiles.includes(gddRel))
      return bad('gddPath must be one of the markdown files found in the project');
    kept.push(gddRel);
  } else {
    if (existsSync(join(root, 'gdd.md')))
      return bad('gdd.md already exists — choose "I have one" instead');
    const text = gddMode === 'paste' ? str('gddText', 200_000) : str('description', 5_000);
    if (!text) return bad(gddMode === 'paste' ? 'paste the doc text' : 'describe the game');
    writeFileSync(
      join(root, 'gdd.md'),
      gddMode === 'paste' ? text + '\n' : gddFromDescription(projectName, text),
    );
    written.push('gdd.md');
  }

  // starter rules + process doc — only where absent
  if (existsSync(join(root, 'CLAUDE.md'))) kept.push('CLAUDE.md');
  else {
    writeFileSync(join(root, 'CLAUDE.md'), claudeMdStarter(projectName));
    written.push('CLAUDE.md');
  }
  const fwSrc = join(courtsideRoot, 'docs', 'framework-v2.md');
  const fwDst = join(root, 'docs', 'framework-v2.md');
  if (existsSync(fwDst)) kept.push('docs/framework-v2.md');
  else if (existsSync(fwSrc)) {
    mkdirSync(join(root, 'docs'), { recursive: true });
    copyFileSync(fwSrc, fwDst);
    written.push('docs/framework-v2.md');
  }

  written.push(
    writeProjectConfig(root, {
      project: projectName,
      engine: engine ? (engine as 'godot' | 'unity' | 'none') : undefined,
      gdd: gddRel,
      agentCmd: agentCmd || undefined,
    }),
  );

  // the board itself — contract-validated before it touches disk
  const state = freshState(projectName, `wrote ${[...written, 'plan/state.json'].join(', ')}`);
  const checked = validateState(state);
  if (!checked.ok)
    return {
      status: 400,
      payload: { error: `fresh state failed the contract: ${checked.errors[0]}` },
    };
  mkdirSync(planDir, { recursive: true });
  writeFileSync(join(planDir, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  written.push('plan/state.json');

  return { status: 200, payload: { ok: true, written, kept } };
}

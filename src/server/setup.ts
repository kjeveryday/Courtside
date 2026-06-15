// Pre-game setup (TASK-31, DEC-37): stands up an EMPTY project from a few
// answers. Hard rules: only runs when plan/state.json is absent; never
// overwrites an existing file (existing work is reported as kept, not
// replaced); every write is confined to the project root; the fresh state is
// contract-validated before it touches disk.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, normalize } from 'node:path';
import { validateState } from '../contract/validate.ts';
import { writeProjectConfig } from '../core/projectConfig.ts';
import { claudeMdStarter, freshState, gddFromDescription } from './templates.ts';

export type SetupInfo = {
  root: string; // absolute project folder the answers apply to
  projectName: string;
  mdFiles: string[]; // candidate design docs (project root + docs/, relative)
  hasProjectGodot: boolean;
  hasClaudeMd: boolean;
  hasFrameworkDoc: boolean;
};

// The owner may stand the project up anywhere on their machine (TASK-32):
// absolute or ~ paths only, the parent must already exist (typo guard), and
// never inside the demo fixture. Empty input = the folder the server watches.
export function resolveProjectDir(
  raw: unknown,
  fallbackRoot: string,
): { ok: true; root: string } | { ok: false; error: string } {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t) return { ok: true, root: fallbackRoot };
  const expanded = t === '~' || t.startsWith('~/') ? join(homedir(), t.slice(1)) : t;
  if (!isAbsolute(expanded)) return { ok: false, error: 'use an absolute folder path (or ~/…)' };
  const root = normalize(expanded);
  if (!existsSync(dirname(root)))
    return { ok: false, error: `parent folder doesn't exist: ${dirname(root)}` };
  if (existsSync(root) && !statSync(root).isDirectory())
    return { ok: false, error: 'that path is a file, not a folder' };
  if (root.includes(join('spec', 'fixtures', 'sample-project')))
    return { ok: false, error: 'that is the demo fixture — pick a real folder' };
  return { ok: true, root };
}

const listMd = (dir: string, prefix: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('.'))
        .map((e) => (prefix ? `${prefix}/${e.name}` : e.name))
    : [];

export function setupInfo(planDir: string): SetupInfo {
  const root = dirname(planDir);
  return {
    root,
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
    return {
      status: 409,
      payload: {
        error: 'that folder already has a Courtside plan — point the server at it instead',
      },
    };
  mkdirSync(root, { recursive: true }); // the chosen folder may not exist yet

  const str = (k: string, max: number) =>
    typeof answers[k] === 'string' ? (answers[k] as string).trim().slice(0, max) : '';
  const projectName = str('projectName', 80) || basename(root);
  const gddMode = str('gddMode', 16);
  const engine = str('engine', 16);
  const agentCmd = str('agentCmd', 200);
  if (!['have', 'text', 'folder'].includes(gddMode))
    return bad('gddMode must be have | text | folder');
  if (engine && !['godot', 'unity', 'none'].includes(engine))
    return bad('engine must be godot | unity | none');

  const written: string[] = [];
  const kept: string[] = [];

  // design doc — three honest paths, no overwrites
  let gddRel: string | undefined;
  let gddDir: string | undefined;

  if (gddMode === 'have') {
    gddRel = str('gddPath', 200);
    if (!setupInfo(planDir).mdFiles.includes(gddRel))
      return bad('gddPath must be one of the markdown files found in the project');
    kept.push(gddRel);
  } else if (gddMode === 'text') {
    gddRel = 'gdd.md';
    if (existsSync(join(root, 'gdd.md')))
      return bad('gdd.md already exists — choose "use a file I have" instead');
    const text = str('gddText', 200_000);
    if (!text) return bad('write or paste something about the game');
    // one text box, one visible rule: a full doc (has headings) lands verbatim;
    // a plain description gets the starter sections Phase 0 expands
    const isDoc = /^#{1,6}\s/m.test(text);
    writeFileSync(
      join(root, 'gdd.md'),
      isDoc ? text + '\n' : gddFromDescription(projectName, text),
    );
    written.push('gdd.md');
  } else {
    // folder mode: an external docs folder the agent reads directly
    const rawDir = str('gddDir', 500);
    if (!rawDir) return bad('pick a folder containing your design docs');
    const expanded =
      rawDir === '~' || rawDir.startsWith('~/') ? join(homedir(), rawDir.slice(1)) : rawDir;
    if (!isAbsolute(expanded)) return bad('gddDir must be an absolute path (or ~/…)');
    if (!existsSync(expanded) || !statSync(expanded).isDirectory())
      return bad('gddDir: folder not found');
    const docCount = readdirSync(expanded).filter(
      (f) => (f.endsWith('.md') || f.endsWith('.txt')) && !f.startsWith('.'),
    ).length;
    if (docCount === 0) return bad('no .md or .txt files found in that folder');
    gddDir = expanded;
  }

  // starter rules + process doc — only where absent
  if (existsSync(join(root, 'CLAUDE.md'))) kept.push('CLAUDE.md');
  else {
    writeFileSync(join(root, 'CLAUDE.md'), claudeMdStarter(projectName, gddDir));
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
      gddDir,
      agentCmd: agentCmd || undefined,
    }),
  );

  // the board itself — contract-validated before it touches disk
  const state = freshState(
    projectName,
    `wrote ${[...written, 'plan/state.json'].join(', ')}`,
    gddDir,
  );
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

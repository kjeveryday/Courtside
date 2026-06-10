// F0 doctor: one check engine, two surfaces (CLI + UI). Every check returns a
// fix-it line; deferred capabilities surface as honest `skip`s, never silence.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { lintPlan } from './lint.ts';

export type DoctorFinding = {
  id: string;
  category: 'environment' | 'agent' | 'project' | 'engine' | 'security';
  status: 'pass' | 'warn' | 'fail' | 'skip';
  detail: string;
  fixit?: string;
};

// Engine checks are a plugin surface (PRD F0); v0.1 ships the interface only.
export type EnginePlugin = { id: string; name: string; check: () => DoctorFinding[] };

export function checkNodeVersion(version: string, floor: number): DoctorFinding {
  const major = Number(version.replace(/^v/, '').split('.')[0]);
  return {
    id: 'node',
    category: 'environment',
    status: major >= floor ? 'pass' : 'fail',
    detail: `node ${version} (needs >= ${floor} for node:sqlite + native TS)`,
    fixit: major >= floor ? undefined : `install Node ${floor}+ (nvm install ${floor})`,
  };
}

export type DoctorContext = {
  repoRoot: string;
  planDir: string;
  runtimeDir: string;
  enginePlugins?: EnginePlugin[];
};

export function runDoctor(ctx: DoctorContext): DoctorFinding[] {
  const f: DoctorFinding[] = [];
  f.push(checkNodeVersion(process.version, 24));

  const hasGit = existsSync(join(ctx.repoRoot, '.git'));
  f.push({
    id: 'git',
    category: 'environment',
    status: hasGit ? 'pass' : 'warn',
    detail: hasGit ? 'git repository detected' : 'not a git repository',
    fixit: hasGit ? undefined : 'git init (commit-per-task needs a repo)',
  });
  f.push({
    id: 'git-remote',
    category: 'environment',
    status: existsSync(join(ctx.repoRoot, '.git', 'refs', 'remotes')) ? 'pass' : 'warn',
    detail: 'remote configured (auth/push dry-run checks arrive with GitHub connect, v0.2)',
    fixit: 'git remote add origin <url>',
  });

  const claudeMd = join(ctx.repoRoot, 'CLAUDE.md');
  const hasMarker =
    existsSync(claudeMd) && readFileSync(claudeMd, 'utf-8').includes('framework-v2');
  f.push({
    id: 'claude-md',
    category: 'agent',
    status: hasMarker ? 'pass' : 'warn',
    detail: hasMarker ? 'CLAUDE.md present with framework rules' : 'CLAUDE.md missing or unmarked',
    fixit: hasMarker ? undefined : 'add the framework-v2 rules block to CLAUDE.md',
  });
  f.push({
    id: 'mcp',
    category: 'agent',
    status: 'skip',
    detail: 'MCP handshake — live mode is v0.2 (M2); async file gates need no MCP',
  });

  f.push({
    id: 'plan-dir',
    category: 'project',
    status: existsSync(join(ctx.planDir, 'state.json')) ? 'pass' : 'fail',
    detail: `plan dir: ${ctx.planDir}`,
    fixit: 'point --plan-dir at a directory containing state.json',
  });
  const lint = existsSync(join(ctx.planDir, 'state.json'))
    ? lintPlan(ctx.planDir, ctx.runtimeDir)
    : [];
  const lintFails = lint.filter((l) => l.level === 'fail');
  const lintWarns = lint.filter((l) => l.level === 'warn');
  f.push({
    id: 'state-valid',
    category: 'project',
    status: lintFails.length > 0 ? 'fail' : 'pass',
    detail:
      lintFails.length > 0
        ? `courtside lint: ${lintFails[0]!.text}`
        : `courtside lint clean (${lintWarns.length} warnings)`,
    fixit: lintFails.length > 0 ? 'fix state.json / referenced files, then re-run' : undefined,
  });
  f.push({
    id: 'framework-doc',
    category: 'project',
    status: existsSync(join(ctx.repoRoot, 'docs', 'framework-v2.md')) ? 'pass' : 'warn',
    detail: 'docs/framework-v2.md',
    fixit: 'add the framework doc the workflow runs on',
  });
  try {
    const big = readdirSync(join(ctx.repoRoot, 'docs')).filter(
      (d) => statSync(join(ctx.repoRoot, 'docs', d)).size > 300_000,
    );
    f.push({
      id: 'doc-size',
      category: 'project',
      status: big.length > 0 ? 'warn' : 'pass',
      detail:
        big.length > 0
          ? `oversized design docs (context-window risk): ${big.join(', ')}`
          : 'design docs within context-friendly sizes',
      fixit:
        big.length > 0 ? 'add a section map; feed the agent sections, not the file' : undefined,
    });
  } catch {
    f.push({ id: 'doc-size', category: 'project', status: 'skip', detail: 'no docs/ directory' });
  }

  const plugins = ctx.enginePlugins ?? [];
  if (plugins.length === 0) {
    f.push({
      id: 'engine',
      category: 'engine',
      status: 'skip',
      detail:
        'no engine plugin configured — interface ready (Godot/Unity adapters are per-project)',
    });
  } else {
    for (const p of plugins) f.push(...p.check());
  }

  f.push({
    id: 'secret',
    category: 'security',
    status: 'pass',
    detail: existsSync(join(ctx.runtimeDir, 'secret'))
      ? 'decision-log secret present (.courtside/secret, outside git)'
      : 'decision-log secret will be created at first decision',
  });
  return f;
}

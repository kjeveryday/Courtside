// Pre-game setup (TASK-31, DEC-37): the screen an EMPTY project gets. A few
// questions → the server writes config, plan, and starter docs (never touching
// anything that exists) and the live board takes over on the next push.
import { useState } from 'react';
import { postSetup, postTestAgent, type SetupInfo } from '../lib/api';

const field = 'mt-1.5 w-full rounded border border-line bg-surface2 px-2.5 py-2 text-xs';
const chipCls = (on: boolean) =>
  `rounded border px-2.5 py-1 font-mono text-[11px] ${on ? 'border-accent text-accent' : 'border-line text-muted'}`;

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-line pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        {n} · {title}
      </p>
      {children}
    </div>
  );
}

export function Wizard({ token, info }: { token: string; info: SetupInfo }) {
  const [name, setName] = useState(info.projectName);
  const [gddMode, setGddMode] = useState<'have' | 'paste' | 'describe'>(
    info.mdFiles.length > 0 ? 'have' : 'describe',
  );
  const [gddPath, setGddPath] = useState(info.mdFiles[0] ?? '');
  const [gddText, setGddText] = useState('');
  const [engine, setEngine] = useState<'godot' | 'unity' | 'none'>(
    info.hasProjectGodot ? 'godot' : 'none',
  );
  const [agentCmd, setAgentCmd] = useState('');
  const [test, setTest] = useState<{ busy?: boolean; ok?: boolean; detail?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const willWrite = [
    gddMode !== 'have' ? 'gdd.md' : null,
    info.hasClaudeMd ? null : 'CLAUDE.md',
    info.hasFrameworkDoc ? null : 'docs/framework-v2.md',
    'courtside.config.json',
    'plan/state.json',
  ].filter(Boolean) as string[];
  const willKeep = [
    gddMode === 'have' ? gddPath : null,
    info.hasClaudeMd ? 'CLAUDE.md (yours, untouched)' : null,
    info.hasFrameworkDoc ? 'docs/framework-v2.md' : null,
  ].filter(Boolean) as string[];

  const runTest = async () => {
    setTest({ busy: true });
    setTest(await postTestAgent(token, agentCmd.trim()));
  };
  const submit = async () => {
    setBusy(true);
    setError('');
    const r = await postSetup(token, {
      projectName: name.trim(),
      gddMode,
      gddPath: gddMode === 'have' ? gddPath : undefined,
      gddText: gddMode === 'paste' ? gddText : undefined,
      description: gddMode === 'describe' ? gddText : undefined,
      engine,
      agentCmd: agentCmd.trim() || undefined,
    });
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
    }
    // success needs nothing here: state.json lands → watcher pushes → board
  };

  const ready = name.trim() !== '' && (gddMode === 'have' ? gddPath !== '' : gddText.trim() !== '');
  return (
    <section className="mx-auto max-w-[640px] rounded-card border border-accent bg-surface p-6">
      <h2 className="font-display text-[22px] font-semibold">Pre-game setup</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        This project has no plan yet. A few answers and the board goes live — nothing that already
        exists gets overwritten.
      </p>

      <Section n={1} title="the game">
        <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </Section>

      <Section n={2} title="design doc">
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {info.mdFiles.length > 0 && (
            <button onClick={() => setGddMode('have')} className={chipCls(gddMode === 'have')}>
              I have one
            </button>
          )}
          <button onClick={() => setGddMode('paste')} className={chipCls(gddMode === 'paste')}>
            paste it
          </button>
          <button
            onClick={() => setGddMode('describe')}
            className={chipCls(gddMode === 'describe')}
          >
            describe the game
          </button>
        </div>
        {gddMode === 'have' ? (
          <select value={gddPath} onChange={(e) => setGddPath(e.target.value)} className={field}>
            {info.mdFiles.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        ) : (
          <textarea
            value={gddText}
            onChange={(e) => setGddText(e.target.value)}
            rows={gddMode === 'paste' ? 6 : 4}
            placeholder={
              gddMode === 'paste'
                ? 'paste your design doc — it becomes gdd.md'
                : 'the game you want to make, in your words — your agent expands it with you (Phase 0)'
            }
            className={field}
          />
        )}
      </Section>

      <Section n={3} title="engine">
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {(['godot', 'unity', 'none'] as const).map((e) => (
            <button key={e} onClick={() => setEngine(e)} className={chipCls(engine === e)}>
              {e}
            </button>
          ))}
          {info.hasProjectGodot && (
            <span className="font-mono text-[10px] text-ok">project.godot detected ✓</span>
          )}
        </div>
      </Section>

      <Section n={4} title="agent (optional)">
        <div className="flex gap-2">
          <input
            value={agentCmd}
            onChange={(e) => setAgentCmd(e.target.value)}
            placeholder={'e.g. "claude" — powers send-to-agent and written ask answers'}
            className={field}
          />
          <button
            onClick={() => void runTest()}
            disabled={test.busy || agentCmd.trim() === ''}
            className="mt-1.5 rounded border border-line px-2.5 font-mono text-[11px] text-muted disabled:opacity-35"
          >
            {test.busy ? 'testing…' : 'test ▸'}
          </button>
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted">
          {test.detail
            ? `${test.ok ? '✓' : '✗'} ${test.detail}`
            : 'test runs one tiny prompt through your command (uses a sliver of agent credit) · skip to connect later'}
        </p>
      </Section>

      <Section n={5} title="what happens">
        <p className="mt-1 font-mono text-[11px] text-muted">
          write: {willWrite.join(' · ')}
          {willKeep.length > 0 ? ` — keep: ${willKeep.join(' · ')}` : ''}
        </p>
      </Section>

      {error && <p className="mt-3 font-mono text-[11px] text-risk">{error}</p>}
      <button
        onClick={() => void submit()}
        disabled={!ready || busy}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-35"
      >
        {busy ? 'setting up…' : 'Set up the project ▸'}
      </button>
    </section>
  );
}

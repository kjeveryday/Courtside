// Pre-game setup (TASK-31/32, DEC-37/38): the screen an EMPTY project gets.
// Pick where the project lives (the server follows), answer a few questions,
// and the live board takes over in place — nothing existing gets overwritten.
import { useState } from 'react';
import { fetchSetupInfo, postSetup, postTestAgent, type SetupInfo } from '../lib/api';

const field = 'mt-1.5 w-full rounded border border-line bg-surface2 px-2.5 py-2 text-xs';
const chipCls = (on: boolean) =>
  `rounded border px-2.5 py-1 font-mono text-[11px] ${on ? 'border-accent text-accent' : 'border-line text-muted'}`;
// mirror of the server's rule: text with markdown headings lands verbatim,
// a plain description gets starter sections for Phase 0 to expand
const isDoc = (t: string) => /^#{1,6}\s/m.test(t);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-line pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <p className="mb-1 text-[13px] font-semibold">{title}</p>
      {children}
    </div>
  );
}

export function Wizard({ token, info: boot }: { token: string; info: SetupInfo }) {
  const [info, setInfo] = useState(boot);
  const [dir, setDir] = useState(boot.root);
  const [dirNote, setDirNote] = useState('');
  const [name, setName] = useState(boot.projectName);
  const [nameTouched, setNameTouched] = useState(false);
  const [gddMode, setGddMode] = useState<'have' | 'text'>(boot.mdFiles.length ? 'have' : 'text');
  const [gddPath, setGddPath] = useState(boot.mdFiles[0] ?? '');
  const [gddText, setGddText] = useState('');
  const [engine, setEngine] = useState<'godot' | 'unity' | 'none'>(
    boot.hasProjectGodot ? 'godot' : 'none',
  );
  const [agentCmd, setAgentCmd] = useState('');
  const [test, setTest] = useState<{ busy?: boolean; ok?: boolean; detail?: string }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // "where" preflight: validate the folder, refresh what's found there
  const checkDir = async () => {
    if (dir.trim() === info.root) return;
    const r = await fetchSetupInfo(token, dir);
    if (!r.ok) return setDirNote(`✗ ${r.error}`);
    setInfo(r.info);
    setDir(r.info.root);
    setDirNote('✓ this folder');
    if (!nameTouched) setName(r.info.projectName);
    setGddPath(r.info.mdFiles[0] ?? '');
    if (r.info.mdFiles.length === 0) setGddMode('text');
    setEngine(r.info.hasProjectGodot ? 'godot' : 'none');
  };

  const gddNote =
    gddMode === 'have'
      ? gddPath
      : isDoc(gddText)
        ? 'gdd.md (your text, verbatim)'
        : 'gdd.md (your text + starter sections)';
  const willWrite = [
    gddMode === 'text' ? gddNote : null,
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

  const submit = async () => {
    setBusy(true);
    setError('');
    const r = await postSetup(token, {
      dir,
      projectName: name.trim(),
      gddMode,
      gddPath: gddMode === 'have' ? gddPath : undefined,
      gddText: gddMode === 'text' ? gddText : undefined,
      engine,
      agentCmd: agentCmd.trim() || undefined,
    });
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
    }
    // success needs nothing here: the server follows the folder and pushes the board
  };

  const ready = name.trim() !== '' && (gddMode === 'have' ? gddPath !== '' : gddText.trim() !== '');
  return (
    <section className="mx-auto max-w-[640px] rounded-card border border-accent bg-surface p-6">
      <h2 className="font-display text-[22px] font-semibold">Pre-game setup</h2>
      <p className="mt-1 text-[12.5px] text-muted">
        No plan here yet. A few answers and the board goes live — nothing that already exists gets
        overwritten.
      </p>

      <Section title="Where does your game project live?">
        <p className="mb-1 text-[11px] text-muted">
          Paste the folder path on your computer — absolute path or starting with ~/
        </p>
        <input
          value={dir}
          onChange={(e) => setDir(e.target.value)}
          onBlur={() => void checkDir()}
          onKeyDown={(e) => e.key === 'Enter' && void checkDir()}
          placeholder="e.g. ~/projects/my-game or /Users/you/projects/my-game"
          title="the folder the project lives in — absolute or ~ path; it's created if missing"
          className={`${field} font-mono`}
        />
        {dirNote && (
          <p
            className={`mt-1 font-mono text-[10px] ${dirNote.startsWith('✗') ? 'text-risk' : 'text-ok'}`}
          >
            {dirNote}
          </p>
        )}
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(true);
          }}
          placeholder="Your game's name"
          className={field}
        />
      </Section>

      <Section title="Tell us about your game">
        {info.mdFiles.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button onClick={() => setGddMode('have')} className={chipCls(gddMode === 'have')}>
              I have a design doc
            </button>
            <button onClick={() => setGddMode('text')} className={chipCls(gddMode === 'text')}>
              write / paste
            </button>
          </div>
        )}
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
            rows={5}
            placeholder="paste your design doc, or just describe the game in your words — plain descriptions get starter sections your agent expands with you (Phase 0)"
            className={field}
          />
        )}
      </Section>

      <Section title="What engine are you building with?">
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

      <Section title="Connect your AI (optional)">
        <p className="mb-1.5 text-[11px] text-muted">
          If you&apos;re using Claude Code or another AI tool, type its start command here and
          Courtside can launch it for you. You can always skip this and connect it later.
        </p>
        <div className="flex gap-2">
          <input
            value={agentCmd}
            onChange={(e) => setAgentCmd(e.target.value)}
            placeholder={'e.g. "claude" — the command you use to start your AI'}
            className={field}
          />
          <button
            onClick={async () => {
              setTest({ busy: true });
              setTest(await postTestAgent(token, agentCmd.trim()));
            }}
            disabled={test.busy || agentCmd.trim() === ''}
            className="mt-1.5 rounded border border-line px-2.5 font-mono text-[11px] text-muted disabled:opacity-35"
          >
            {test.busy ? 'checking…' : 'check if it works'}
          </button>
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted">
          {test.detail
            ? `${test.ok ? '✓' : '✗'} ${test.detail}`
            : 'checking runs one tiny prompt through your command (uses a sliver of AI credit)'}
        </p>
      </Section>

      <Section title="What Courtside will set up">
        <p className="mt-1 font-mono text-[11px] text-muted">
          in {dir} — write: {willWrite.join(' · ')}
          {willKeep.length > 0 ? ` — keep: ${willKeep.join(' · ')}` : ''}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          From then on, the Courtside icon on your Desktop opens this project.
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

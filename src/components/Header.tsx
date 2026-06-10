// Header per the mock's layout grammar: brand wordmark + mono phase chip.
// Health badge arrives with S6 (doctor); theme toggle is M3 — neither is faked here.
export function Header({ phase, slice }: { phase?: string; slice?: string }) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-line py-4">
      <div className="font-display text-[26px] font-bold tracking-[0.06em] uppercase">
        Court<span className="text-accent">side</span>
      </div>
      {phase && (
        <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">
          Phase {phase}
          {slice ? ` · ${slice}` : ''}
        </span>
      )}
    </header>
  );
}

// Header per the mock's layout grammar: brand wordmark + mono phase chip + live
// connection dot (S4). Health badge arrives with S6 (doctor); theme toggle is M3.
import type { WsStatus } from '../lib/api';

const LIVE_TONE: Record<WsStatus, { dot: string; label: string; text: string }> = {
  live: { dot: 'bg-ok', label: 'live', text: 'text-ok' },
  connecting: { dot: 'bg-muted', label: 'connecting…', text: 'text-muted' },
  lost: { dot: 'bg-risk', label: 'connection lost — retrying', text: 'text-risk' },
};

export function Header({
  phase,
  slice,
  live,
  health,
}: {
  phase?: string;
  slice?: string;
  live?: WsStatus;
  health?: React.ReactNode;
}) {
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
      {health}
      <span className="flex-1" />
      {live && (
        <span className={`flex items-center gap-1.5 font-mono text-[11px] ${LIVE_TONE[live].text}`}>
          <span className={`h-2 w-2 rounded-full ${LIVE_TONE[live].dot}`} />
          {LIVE_TONE[live].label}
        </span>
      )}
    </header>
  );
}

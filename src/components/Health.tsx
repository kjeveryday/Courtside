// F0 health badge + preflight panel: server-run checks (verified provenance),
// worst-status dot in the header, click-through to fix-it lines. Decays live —
// App refetches on every state push.
import type { DoctorFinding } from '../core/doctor';

export type DoctorReport = { ranAt: string; findings: DoctorFinding[] };

const ICONS: Record<DoctorFinding['status'], string> = {
  pass: '✓',
  warn: '!',
  fail: '✗',
  skip: '–',
};

export function worstStatus(findings: DoctorFinding[]): 'ok' | 'warn' | 'fail' {
  if (findings.some((f) => f.status === 'fail')) return 'fail';
  if (findings.some((f) => f.status === 'warn')) return 'warn';
  return 'ok';
}

export function HealthBadge({
  report,
  open,
  onToggle,
}: {
  report: DoctorReport | null;
  open: boolean;
  onToggle: () => void;
}) {
  if (!report) return null;
  const worst = worstStatus(report.findings);
  const warns = report.findings.filter((f) => f.status === 'warn').length;
  const tone =
    worst === 'fail'
      ? { dot: 'bg-risk', text: 'text-risk', label: 'doctor: failing — click' }
      : worst === 'warn'
        ? {
            dot: 'bg-accent',
            text: 'text-accent',
            label: `doctor: ${warns} warning${warns > 1 ? 's' : ''}`,
          }
        : { dot: 'bg-ok', text: 'text-ok', label: 'doctor: all green' };
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 font-mono text-[11px] ${tone.text}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${tone.dot} ${worst === 'ok' ? 'shadow-[0_0_6px_var(--color-ok)]' : ''}`}
      />
      {tone.label} {open ? '▴' : '▾'}
    </button>
  );
}

export function PreflightPanel({ report, onRerun }: { report: DoctorReport; onRerun: () => void }) {
  const categories = [...new Set(report.findings.map((f) => f.category))];
  return (
    <section className="mb-5 rounded-card border border-line bg-surface p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          Pre-game warmup · doctor
        </h2>
        <button
          onClick={onRerun}
          className="rounded border border-line bg-surface2 px-2.5 py-1 font-mono text-[11px]"
        >
          re-run checks
        </button>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="mb-2.5">
          <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">{cat}</p>
          {report.findings
            .filter((f) => f.category === cat)
            .map((f) => (
              <p key={f.id} className="ml-1 py-0.5 text-xs">
                <span
                  className={
                    f.status === 'fail'
                      ? 'text-risk'
                      : f.status === 'warn'
                        ? 'text-accent'
                        : f.status === 'pass'
                          ? 'text-ok'
                          : 'text-muted'
                  }
                >
                  {ICONS[f.status]}
                </span>{' '}
                <span className="font-mono text-[11px]">{f.id}</span> — {f.detail}
                {f.fixit && <span className="text-muted"> · fix: {f.fixit}</span>}
              </p>
            ))}
        </div>
      ))}
      <p className="font-mono text-[10px] text-muted">ran {report.ranAt} · server-verified</p>
    </section>
  );
}

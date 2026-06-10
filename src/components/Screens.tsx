// Full-page non-data screens: token lockout and the refusal state (PRD §5 —
// invalid state never renders as truth, so these show zero plan data).
export function LockedOut({ detail }: { detail: string }) {
  return (
    <section className="rounded-card border border-accent/50 bg-surface p-6">
      <p className="font-display text-xl font-semibold text-accent">Locked — token required</p>
      <p className="mt-2 text-sm text-muted">
        This dashboard authenticates with a token printed when the server starts ({detail}). Start
        it with <span className="font-mono">npm run dev</span> and open the printed{' '}
        <span className="font-mono">http://127.0.0.1:4310/?token=…</span> link.
      </p>
    </section>
  );
}

export function RefusalState({ errors }: { errors: string[] }) {
  return (
    <section>
      <p className="font-medium text-risk">state invalid ✗ — refusing to render</p>
      <ul className="mt-3 space-y-1 rounded-card border border-risk/40 bg-risk/10 p-4 font-mono text-xs text-risk">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Invalid state never renders as truth (PRD §5). Fix the watched file; this view recovers
        automatically once it validates.
      </p>
    </section>
  );
}

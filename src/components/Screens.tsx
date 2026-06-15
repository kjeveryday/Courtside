// Full-page non-data screens: token lockout and the refusal state. The refusal
// shows zero plan data by design — errors only.
export function LockedOut({ detail }: { detail: string }) {
  return (
    <section className="rounded-card border border-accent/50 bg-surface p-6">
      <p className="font-display text-xl font-semibold text-accent">Locked — token required</p>
      <p className="mt-2 text-sm text-muted">
        Start the server (<span className="font-mono">npm run dev</span>) and open the printed token
        link. <span className="font-mono text-[11px]">({detail})</span>
      </p>
    </section>
  );
}

export function RefusalState({ errors }: { errors: string[] }) {
  return (
    <section>
      <p className="font-medium text-risk">state invalid ✗ — not rendering</p>
      <ul className="mt-3 space-y-1 rounded-card border border-risk/40 bg-risk/10 p-4 font-mono text-xs text-risk">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </section>
  );
}

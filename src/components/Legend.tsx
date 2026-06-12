// The dashboard's vocabulary, explained once (DEC-30). Opened from the header "?".
import { ProvenanceBadge } from './Provenance';

function Term({ chip, text }: { chip: React.ReactNode; text: string }) {
  return (
    <p className="flex items-baseline gap-2.5 py-1 text-xs">
      <span className="w-40 flex-none">{chip}</span>
      <span className="text-muted">{text}</span>
    </p>
  );
}

const chip = (cls: string, label: string) => (
  <span className={`rounded px-1.5 py-px font-mono text-[10px] ${cls}`}>{label}</span>
);
const dot = (cls: string, label: string) => (
  <span className="flex items-center gap-1.5 font-mono text-[11px]">
    <span className={`h-2 w-2 rounded-full ${cls}`} /> {label}
  </span>
);

export function Legend({ onClose }: { onClose: () => void }) {
  return (
    <section className="mb-5 rounded-card border border-line bg-surface p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          Legend
        </h2>
        <button onClick={onClose} className="font-mono text-[11px] text-muted underline">
          close
        </button>
      </div>
      <Term
        chip={<ProvenanceBadge provenance="verified" />}
        text="verified — from tooling Courtside ran or files it checked (tests, lint, git, the decision log)"
      />
      <Term
        chip={<ProvenanceBadge provenance="claimed" />}
        text="claimed — the agent's own account, not checked"
      />
      <Term
        chip={chip('bg-accent/15 text-accent', 'in-review')}
        text="task status: todo → in-progress → in-review (checkpoint posted, your call) → done; revise/blocked follow a rejection"
      />
      <Term
        chip={chip('border border-line bg-surface2 text-muted', 'LOGIC-ONLY → TASK-16')}
        text="no visible result of its own; you'll see it working at the named task"
      />
      <Term
        chip={chip('border border-accent text-accent', 'G5-TASK-12')}
        text="a checkpoint · G0–G5 = phase of the build · G5 = finished work awaiting your verify"
      />
      <Term chip={dot('bg-info', 'narration')} text="ticker dot: the agent explaining itself" />
      <Term chip={dot('bg-ok', 'test / lint')} text="ticker dot: tool output" />
      <Term
        chip={dot('bg-accent', 'checkpoint / dispatch / ask')}
        text="ticker dot: a checkpoint, send-to-agent, or ask event — usually you"
      />
      <Term
        chip={dot('bg-muted', 'push / audit / capture')}
        text="ticker dot: repo and process events (pushes, self-audits, screenshots)"
      />
      <Term
        chip={chip('text-info underline', 'evidence ▸')}
        text="opens the file behind a ✓ — a test log, decision record, or capture"
      />
      <Term
        chip={dot('bg-risk', 'itching')}
        text="age colors: red = open too long (3+ days) or stale state; gray = fresh enough"
      />
    </section>
  );
}

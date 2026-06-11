// F20 Tier 1: "what's going on?" answered in seconds. Every fact is
// server-computed from state + decision log (verified provenance); the panel
// renders, never invents. Tier-2 narrative is M2.
import { useState } from 'react';
import { ProvenanceBadge } from './Provenance';

export type HuddleData = { sinceLabel: string; facts: { text: string; kind: string }[] };

const KIND_DOT: Record<string, string> = {
  shipped: 'bg-ok',
  waiting: 'bg-accent',
  question: 'bg-risk',
  agent: 'bg-info',
  quiet: 'bg-muted',
};

export function HuddleButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="rounded-full border border-line bg-surface2 px-3 py-1 font-mono text-[11px] text-text"
    >
      The Huddle ▸
    </button>
  );
}

export function HuddlePanel({ data, onClose }: { data: HuddleData | null; onClose: () => void }) {
  const [closing] = useState(false);
  if (!data || closing) return null;
  return (
    <section className="mb-5 rounded-card border border-info/50 bg-surface p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          The Huddle · {data.sinceLabel}
        </h2>
        <button onClick={onClose} className="font-mono text-[11px] text-muted underline">
          close
        </button>
      </div>
      <ul>
        {data.facts.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 py-1.5 text-sm">
            <span
              className={`mt-1.5 h-2 w-2 flex-none rounded-full ${KIND_DOT[f.kind] ?? 'bg-muted'}`}
            />
            <span>
              {f.text} <ProvenanceBadge provenance="verified" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

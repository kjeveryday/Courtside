// THE ONLY place claim/verified styling exists (rule 14). Glyph-only: the visual
// distinction does the work; words live in the hover title (DEC-28 copy diet).
type Provenance = 'verified' | 'claimed';

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  if (provenance === 'verified') {
    return (
      <span
        title="verified — from tooling Courtside ran or files it checked, not from prose"
        className="inline-block cursor-help rounded-sm bg-ok/15 px-1 font-mono text-[10px] text-ok"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      title="claimed — the agent's own account, not checked"
      className="inline-block cursor-help rounded-sm border border-muted/50 px-1 font-mono text-[10px] text-muted"
    >
      ◇
    </span>
  );
}

export function EventText({ provenance, text }: { provenance: Provenance; text: string }) {
  return (
    <span>
      {text} <ProvenanceBadge provenance={provenance} />
    </span>
  );
}

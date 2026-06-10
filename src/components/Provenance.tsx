// THE ONLY place claim/verified styling exists (rule 14, PRD §5/F18, delta a).
// Every rendered agent-authored or tool-verified sentence goes through here with
// an explicit provenance — there is no exported "verified style" to misapply.
type Provenance = 'verified' | 'claimed';

export function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  if (provenance === 'verified') {
    return (
      <span className="inline-block rounded-sm bg-ok/15 px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-ok">
        ✓ verified
      </span>
    );
  }
  return (
    <span className="inline-block rounded-sm border border-muted/50 px-1.5 py-px font-mono text-[10px] whitespace-nowrap text-muted">
      ◇ agent-reported
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

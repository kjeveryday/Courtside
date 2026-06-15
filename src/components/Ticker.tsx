// F4 narration ticker: plan events + the server's own observed events, merged
// newest-first with kind-colored dots, provenance badges, and evidence links
// for rows that carry an artifactRef (TASK-28).
import type { CourtsideState } from '../contract/state.generated';
import type { ServerEvent } from '../lib/api';
import { kindColor, localTime, serverKindColor } from '../lib/format';
import { EventText } from './Provenance';

type Row = {
  ts: string;
  text: string;
  provenance: 'verified' | 'claimed';
  title: string;
  dot: string;
  artifactRef?: string;
};

export function Ticker({
  events,
  serverEvents = [],
  token,
}: {
  events: CourtsideState['events'];
  serverEvents?: ServerEvent[];
  token?: string;
}) {
  const rows: Row[] = [
    ...events.map((e) => ({
      ts: e.ts,
      text: e.text,
      provenance: e.provenance,
      title: e.kind.replace('_', ' '),
      dot: kindColor(e.kind),
      artifactRef: e.artifactRef,
    })),
    ...serverEvents.map((e) => ({
      ts: e.ts,
      text: e.text,
      provenance: e.provenance,
      title: `${e.kind.replace(/_/g, ' ')} — observed by Courtside`,
      dot: serverKindColor(e.kind),
    })),
  ].sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        What happened
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-muted">no events yet</p>
      ) : (
        <ul>
          {rows.map((e) => (
            <li
              key={`${e.ts}-${e.title}-${e.text.slice(0, 24)}`}
              className="flex gap-2.5 border-b border-line py-2 text-[12.5px] last:border-b-0"
            >
              <span title={e.title} className={`mt-1.5 h-2 w-2 flex-none rounded-full ${e.dot}`} />
              <time className="flex-none pt-px font-mono text-[10.5px] text-muted">
                {localTime(e.ts)}
              </time>
              <span className="min-w-0">
                <EventText provenance={e.provenance} text={e.text} />
                {e.artifactRef && token && (
                  <a
                    href={`/api/artifact/${e.artifactRef}?token=${token}`}
                    target="_blank"
                    rel="noreferrer"
                    title={e.artifactRef}
                    className="ml-1.5 font-mono text-[10px] text-info underline"
                  >
                    evidence ▸
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

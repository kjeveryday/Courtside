// F4 narration ticker: all events newest-first with kind-colored dots and
// provenance badges. Static render — live updates arrive with S4's WebSocket.
import type { CourtsideState } from '../contract/state.generated';
import { kindColor, localTime } from '../lib/format';
import { EventText } from './Provenance';

export function Ticker({ events }: { events: CourtsideState['events'] }) {
  const newestFirst = [...events].sort((a, b) => b.ts.localeCompare(a.ts));
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
        Ticker
      </h2>
      {newestFirst.length === 0 ? (
        <p className="text-xs text-muted">no events yet</p>
      ) : (
        <ul>
          {newestFirst.map((e) => (
            <li
              key={`${e.ts}-${e.kind}-${e.text.slice(0, 24)}`}
              className="flex gap-2.5 border-b border-line py-2 text-[12.5px] last:border-b-0"
            >
              <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${kindColor(e.kind)}`} />
              <time className="flex-none pt-px font-mono text-[10.5px] text-muted">
                {localTime(e.ts)}
              </time>
              <span className="min-w-0">
                <EventText provenance={e.provenance} text={e.text} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

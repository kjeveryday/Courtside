// Source-doc viewer (DEC-30): shows the referenced design doc and jumps to the
// section the ref's anchor names, highlighting it. Plain rendering on purpose —
// the doc is the artifact; the dashboard just gets you to the right paragraph.
import { useEffect, useRef } from 'react';

const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

// [start, end) line range of the section whose heading slug matches the anchor.
function highlightRange(lines: string[], anchor?: string): [number, number] | null {
  if (!anchor) return null;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = /^#{1,4}\s+(.*)$/.exec(lines[i] ?? '');
    if (!h) continue;
    if (start >= 0) return [start, i];
    if (slug(h[1] ?? '') === anchor) start = i;
  }
  return start >= 0 ? [start, lines.length] : null;
}

export function DocViewer({
  docRef,
  text,
  error,
  onClose,
}: {
  docRef: string; // e.g. "gdd.md#movement-ranges"
  text: string | null;
  error: string | null;
  onClose: () => void;
}) {
  const anchor = docRef.split('#')[1];
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    target.current?.scrollIntoView({ block: 'start' });
  }, [text]);

  const lines = (text ?? '').split('\n');
  const range = highlightRange(lines, anchor);

  return (
    <section className="mb-5 rounded-card border border-info/50 bg-surface p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-mono text-[12px] text-info">{docRef}</h2>
        <button onClick={onClose} className="font-mono text-[11px] text-muted underline">
          close
        </button>
      </div>
      {error && <p className="font-mono text-xs text-risk">{error}</p>}
      {text !== null && (
        <div className="max-h-96 overflow-y-auto rounded border border-line bg-bg p-4">
          {lines.map((line, i) => {
            const heading = /^#{1,4}\s+/.test(line);
            const inSection = range !== null && i >= range[0] && i < range[1];
            return (
              <div
                key={i}
                ref={range !== null && i === range[0] ? target : undefined}
                className={`text-[13px] whitespace-pre-wrap ${
                  heading ? 'mt-3 font-display text-[15px] font-semibold' : ''
                } ${inSection ? 'bg-accent/8 text-text' : 'text-muted'}`}
              >
                {line || ' '}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

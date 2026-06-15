// Source-doc viewer (DEC-30): shows the referenced design doc and jumps to the
// section the ref's anchor names, highlighting it. Plain rendering on purpose —
// the doc is the artifact; the dashboard just gets you to the right paragraph.
import { useEffect, useRef } from 'react';
import { openFileLocally } from '../lib/api';
import { locateSection } from '../lib/anchors';

export function DocViewer({
  docRef,
  text,
  error,
  onClose,
  token,
}: {
  docRef: string; // e.g. "gdd.md#movement-ranges"
  text: string | null;
  error: string | null;
  onClose: () => void;
  token?: string;
}) {
  const anchor = docRef.split('#')[1];
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    target.current?.scrollIntoView({ block: 'start' });
  }, [text]);

  const lines = (text ?? '').split('\n');
  const match = locateSection(lines, anchor);
  const range = match.kind === 'found' ? match.range : null;

  return (
    <section className="mb-5 rounded-card border border-info/50 bg-surface p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-mono text-[12px] text-info">{docRef}</h2>
        <span className="flex items-center gap-3">
          {token && text !== null && (
            <button
              onClick={() => void openFileLocally(token, docRef)}
              className="font-mono text-[11px] text-muted underline"
              title="open in default app"
            >
              open file ▸
            </button>
          )}
          <button onClick={onClose} className="font-mono text-[11px] text-muted underline">
            close
          </button>
        </span>
      </div>
      {error && <p className="font-mono text-xs text-risk">{error}</p>}
      {text !== null && match.kind === 'missing' && (
        <p className="mb-2 font-mono text-[11px] text-muted">
          #{anchor} — section not found; showing the whole doc
        </p>
      )}
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

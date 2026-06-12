// First-time orientation strip: the Courtside loop in 5 steps.
// Dismissed state lives in localStorage — won't reappear after "Got it".
import { useState } from 'react';

const KEY = 'courtside:howto:dismissed';

const STEPS = [
  {
    n: '1',
    title: 'Your AI builds',
    body: "It works through the plan task by task — you don't need to be there.",
  },
  {
    n: '2',
    title: 'It stops at a gate',
    body: 'A checkpoint where it needs your okay before going further.',
  },
  {
    n: '3',
    title: 'You review & decide',
    body: 'Check the verify steps, then approve, reject, or ask for changes.',
  },
  {
    n: '4',
    title: 'Your decision is logged',
    body: 'The agent picks it up next session and keeps building.',
  },
  {
    n: '5',
    title: 'Come back anytime',
    body: 'The Huddle catches you up. Ask answers your questions from the live board.',
  },
];

export function HowTo() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(KEY) === '1');

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  };

  return (
    <section className="mb-5 rounded-card border border-line bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[15px] font-semibold tracking-[0.12em] text-muted uppercase">
          How it works
        </h2>
        <button onClick={dismiss} className="font-mono text-[11px] text-muted underline">
          got it, hide this ▸
        </button>
      </div>
      <div className="grid grid-cols-5 gap-4 max-[860px]:grid-cols-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-line font-mono text-[10px] text-muted">
              {s.n}
            </span>
            <div>
              <p className="text-[13px] font-semibold">{s.title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">{s.body}</p>
              {i < STEPS.length - 1 && (
                <p className="mt-1.5 hidden font-mono text-[10px] text-line max-[860px]:block">↓</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

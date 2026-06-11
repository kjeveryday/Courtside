// F7 verify checklist: every step checked or skipped-with-reason before the
// approve button unlocks (the anti-accident mechanism per Q-6/DEC-24).
export type StepState = {
  text: string;
  checked: boolean;
  skippedReason: string;
  skipping: boolean;
};

export function stepsComplete(steps: StepState[]): boolean {
  return steps.every((s) => s.checked || s.skippedReason.trim() !== '');
}

export function VerifySteps({
  steps,
  onChange,
}: {
  steps: StepState[];
  onChange: (next: StepState[]) => void;
}) {
  const patch = (i: number, p: Partial<StepState>) =>
    onChange(steps.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const done = steps.filter((s) => s.checked || s.skippedReason.trim() !== '').length;
  return (
    <>
      <h3 className="mt-4 mb-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        Verify · {done}/{steps.length}
      </h3>
      {steps.map((s, i) => (
        <div key={s.text} className="mb-2 rounded-lg border border-line bg-bg px-3 py-2.5">
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={s.checked}
              onChange={(e) => patch(i, { checked: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-(--color-accent)"
            />
            <span className={s.checked ? 'text-muted line-through' : ''}>{s.text}</span>
            {!s.checked && (
              <button
                className="ml-auto font-mono text-[10px] text-muted underline"
                // collapsing the skip field withdraws the reason — a hidden
                // reason must not keep counting the step as complete
                onClick={() =>
                  patch(i, s.skipping ? { skipping: false, skippedReason: '' } : { skipping: true })
                }
              >
                skip…
              </button>
            )}
          </label>
          {s.skipping && !s.checked && (
            <input
              value={s.skippedReason}
              onChange={(e) => patch(i, { skippedReason: e.target.value })}
              placeholder="reason for skipping"
              className="mt-2 w-full rounded border border-line bg-surface2 px-2 py-1 text-xs"
            />
          )}
        </div>
      ))}
    </>
  );
}

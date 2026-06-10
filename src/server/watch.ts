// Plan-dir watcher (AD-4): node:fs.watch recursive + trailing debounce. Linux
// recursive support is the known gap (tech-debt D-2; doctor warns there later).
import { watch, type FSWatcher } from 'node:fs';

export function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

export function watchPlanDir(planDir: string, onChange: () => void, debounceMs = 150): FSWatcher {
  const fire = debounce(onChange, debounceMs);
  const watcher = watch(planDir, { recursive: true }, () => fire());
  return watcher;
}

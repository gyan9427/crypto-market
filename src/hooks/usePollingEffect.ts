import { DependencyList, useEffect } from 'react';

interface PollingOptions {
  enabled?: boolean;
  intervalMs: number;
  immediate?: boolean;
}

/**
 * Reusable polling side-effect wrapper for periodic backend sync.
 * Keeps callsites small and consistent across feature hooks/screens.
 */
export function usePollingEffect(
  task: () => void | Promise<void>,
  deps: DependencyList,
  options: PollingOptions
): void {
  const { enabled = true, intervalMs, immediate = true } = options;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      try {
        await task();
      } catch {
        // Intentionally swallow to keep polling loop alive.
      }
    };

    if (immediate) {
      run();
    }

    const timer = setInterval(() => {
      if (!cancelled) {
        run();
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, deps);
}

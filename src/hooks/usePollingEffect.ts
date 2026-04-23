import { DependencyList, useEffect, useRef } from 'react';

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
  const taskRef = useRef(task);
  const runningRef = useRef(false);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        await taskRef.current();
      } catch {
        // Intentionally swallow to keep polling loop alive.
      } finally {
        runningRef.current = false;
      }
    };

    if (immediate) {
      void run();
    }

    const timer = setInterval(() => {
      if (!cancelled) {
        void run();
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
      runningRef.current = false;
    };
  }, [enabled, intervalMs, immediate, ...deps]);
}

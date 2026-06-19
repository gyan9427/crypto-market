import { getIsAuthenticated } from '@/src/services/authSession';
import { incrementPerfCounter, perfLog } from '@/src/runtime/perfInstrumentation';
import { bumpGeneration } from '@/src/runtime/asyncRequestGuard';

let inFlight: Promise<void> | null = null;
let lastRunAt = 0;

async function executeSync(): Promise<void> {
  if (!getIsAuthenticated()) return;

  incrementPerfCounter('backgroundSync');
  perfLog('authBackgroundSync.run');

  const { useAppStore } = await import('@/src/state/useAppStore');
  const { getCurrentUser } = await import('@/src/services/api');
  const { syncLanguageFromServer, retryLanguageSync, syncFollowingCoins } =
    useAppStore.getState();

  await Promise.allSettled([
    getCurrentUser().catch(() => null),
    syncLanguageFromServer(),
    retryLanguageSync(),
    syncFollowingCoins(),
  ]);
}

/** Singleton authenticated background sync — dedupes concurrent callers. */
export function runAuthBackgroundSync(): Promise<void> {
  if (!getIsAuthenticated()) return Promise.resolve();
  if (inFlight) return inFlight;

  lastRunAt = Date.now();
  inFlight = executeSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Debounced foreground refresh — skips if last run within minIntervalMs. */
export function runAuthBackgroundSyncDebounced(minIntervalMs = 5000): void {
  if (!getIsAuthenticated()) return;
  if (Date.now() - lastRunAt < minIntervalMs) {
    perfLog('authBackgroundSync.debounced_skip');
    return;
  }
  void runAuthBackgroundSync();
}

/** Invalidate in-flight sync on logout. */
export function resetAuthBackgroundSync(): void {
  bumpGeneration('auth:bg-sync');
  inFlight = null;
  lastRunAt = 0;
}

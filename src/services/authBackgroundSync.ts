import { useAppStore } from '@/src/state/useAppStore';
import { useAuthStore } from '@/src/state/useAuthStore';
import { getCurrentUser } from '@/src/services/api';
import { incrementPerfCounter, perfLog } from '@/src/runtime/perfInstrumentation';
import { bumpGeneration } from '@/src/runtime/asyncRequestGuard';

let inFlight: Promise<void> | null = null;
let lastRunAt = 0;

async function executeSync(): Promise<void> {
  if (!useAuthStore.getState().isAuthenticated) return;

  incrementPerfCounter('backgroundSync');
  perfLog('authBackgroundSync.run');

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
  if (!useAuthStore.getState().isAuthenticated) return Promise.resolve();
  if (inFlight) return inFlight;

  lastRunAt = Date.now();
  inFlight = executeSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Debounced foreground refresh — skips if last run within minIntervalMs. */
export function runAuthBackgroundSyncDebounced(minIntervalMs = 5000): void {
  if (!useAuthStore.getState().isAuthenticated) return;
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

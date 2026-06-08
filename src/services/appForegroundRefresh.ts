import { incrementPerfCounter, perfLog } from '@/src/runtime/perfInstrumentation';
import {
  runAuthBackgroundSyncDebounced,
} from '@/src/services/authBackgroundSync';
import { refreshRuntimeHintsIfStale } from '@/src/hooks/useRuntimeHints';
import { useFeaturesStore } from '@/src/utils/features';
import { logWsLifecycleSummary } from '@/src/runtime/wsLifecycleMetrics';
import { hydrateMarketSnapshotStore } from '@/src/services/api';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Coalesced foreground refresh — single debounced handler. */
export function scheduleAppForegroundRefresh(): void {
  incrementPerfCounter('appStateTriggers');
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    perfLog('appForegroundRefresh.run');
    logWsLifecycleSummary();
    useFeaturesStore.getState().refetchFeatures();
    runAuthBackgroundSyncDebounced(5000);
    void refreshRuntimeHintsIfStale();
    void hydrateMarketSnapshotStore();
  }, 500);
}

import Constants from 'expo-constants';

/**
 * Phase 5 default: Explore uses GET /api/market/snapshot + WebSocket only (no `/market/trending` on hot path).
 * Set `EXPO_PUBLIC_MARKET_SNAPSHOT_UI=0` to force the legacy trending+snapshot parallel path (emergency rollback only).
 */
export function isMarketSnapshotUiEnabled(): boolean {
  try {
    if (process.env.EXPO_PUBLIC_MARKET_SNAPSHOT_UI === '0') {
      return false;
    }
  } catch {
    /* no process in some runtimes */
  }
  const extra = Constants.expoConfig?.extra as { marketSnapshotUi?: boolean } | undefined;
  if (extra?.marketSnapshotUi === false) {
    return false;
  }
  return true;
}

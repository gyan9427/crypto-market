import Constants from 'expo-constants';

/**
 * Phase 2 A/B: when true, Explore list renders from GET /api/market/snapshot (still fetches /market/trending in parallel).
 * Enable with EXPO_PUBLIC_MARKET_SNAPSHOT_UI=1 or app.json expo.extra.marketSnapshotUi = true
 */
export function isMarketSnapshotUiEnabled(): boolean {
  try {
    if (process.env.EXPO_PUBLIC_MARKET_SNAPSHOT_UI === '1') {
      return true;
    }
  } catch {
    /* no process in some runtimes */
  }
  const extra = Constants.expoConfig?.extra as { marketSnapshotUi?: boolean } | undefined;
  return extra?.marketSnapshotUi === true;
}

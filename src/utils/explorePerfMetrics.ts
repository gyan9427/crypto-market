export interface ReconcileStats {
  rowsUpdated: number;
  rowsSkipped: number;
  sparklinesReused: number;
  sparklinesRecreated: number;
}

export interface ExplorePerfSnapshot {
  reconcile: ReconcileStats;
  renders: Record<string, number>;
  lastPollAt: number | null;
}

const emptyReconcile: ReconcileStats = {
  rowsUpdated: 0,
  rowsSkipped: 0,
  sparklinesReused: 0,
  sparklinesRecreated: 0,
};

let lastReconcile: ReconcileStats = { ...emptyReconcile };
let lastPollAt: number | null = null;
const renderCounts: Record<string, number> = {};

export function recordPollReconcile(stats: ReconcileStats): void {
  lastReconcile = { ...stats };
  lastPollAt = Date.now();
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(
      `[explore-perf] poll updated=${stats.rowsUpdated} skipped=${stats.rowsSkipped} ` +
        `sparklineReuse=${stats.sparklinesReused} sparklineNew=${stats.sparklinesRecreated}`
    );
  }
}

export function recordExploreRender(component: string, coinId?: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const key = coinId ? `${component}:${coinId}` : component;
  renderCounts[key] = (renderCounts[key] ?? 0) + 1;
}

export function getExplorePerfSnapshot(): ExplorePerfSnapshot {
  return {
    reconcile: { ...lastReconcile },
    renders: { ...renderCounts },
    lastPollAt,
  };
}

export function resetExplorePerfMetrics(): void {
  lastReconcile = { ...emptyReconcile };
  lastPollAt = null;
  for (const key of Object.keys(renderCounts)) {
    delete renderCounts[key];
  }
}

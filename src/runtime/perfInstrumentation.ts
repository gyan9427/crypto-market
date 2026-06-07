/**
 * Dev/staging perf instrumentation — gated by __DEV__ or EXPO_PUBLIC_PERF_TRACE.
 */

const PERF_TRACE =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_PERF_TRACE === 'true';

let logCount = 0;
const MAX_LOGS = 50;

export type BaselineMetrics = {
  capturedAt: string;
  branch: string;
  homeScreenCommitCount?: number;
  duplicateApiCalls?: number;
  wsConnectionCount?: number;
  appStateTriggerCount?: number;
  startupTier1Ms?: number;
  feedOrchestrationCount?: number;
  riskEnrichCount?: number;
  piFetchCount?: number;
  backgroundSyncCount?: number;
  riskSnapshotFetchCount?: number;
  riskSnapshotDedupeCount?: number;
  riskSnapshotWsRefreshCount?: number;
  riskSnapshotPollCount?: number;
};

let baseline: Partial<BaselineMetrics> = {
  capturedAt: new Date().toISOString(),
  branch: 'portfolio-engine',
};

const counters: Record<string, number> = {
  appStateTriggers: 0,
  feedOrchestration: 0,
  riskEnrich: 0,
  piFetch: 0,
  backgroundSync: 0,
  apiFetch: 0,
  riskSnapshotFetch: 0,
  riskSnapshotDedupe: 0,
  riskSnapshotWsRefresh: 0,
  riskSnapshotPoll: 0,
};

export function perfLog(label: string, detail?: Record<string, unknown>): void {
  if (!PERF_TRACE) return;
  if (logCount >= MAX_LOGS) return;
  logCount += 1;
  console.log(`[perf] ${label}`, detail ?? '');
}

export function markStartupTier1Begin(): number {
  return performance.now();
}

export function markStartupTier1End(startMs: number): void {
  const delta = Math.round(performance.now() - startMs);
  baseline.startupTier1Ms = delta;
  perfLog('startup.tier1_ms', { ms: delta });
}

export function incrementPerfCounter(name: keyof typeof counters): void {
  counters[name] = (counters[name] ?? 0) + 1;
}

export function getPerfCounters(): Readonly<Record<string, number>> {
  return { ...counters };
}

export function recordBaselineSnapshot(partial: Partial<BaselineMetrics>): void {
  baseline = { ...baseline, ...partial, capturedAt: new Date().toISOString() };
}

export function getBaselineSnapshot(): BaselineMetrics {
  return {
    capturedAt: baseline.capturedAt ?? new Date().toISOString(),
    branch: baseline.branch ?? 'portfolio-engine',
    homeScreenCommitCount: baseline.homeScreenCommitCount,
    duplicateApiCalls: baseline.duplicateApiCalls ?? counters.apiFetch,
    wsConnectionCount: baseline.wsConnectionCount,
    appStateTriggerCount: baseline.appStateTriggerCount ?? counters.appStateTriggers,
    startupTier1Ms: baseline.startupTier1Ms,
    feedOrchestrationCount: baseline.feedOrchestrationCount ?? counters.feedOrchestration,
    riskEnrichCount: counters.riskEnrich,
    piFetchCount: counters.piFetch,
    backgroundSyncCount: counters.backgroundSync,
    riskSnapshotFetchCount: counters.riskSnapshotFetch,
    riskSnapshotDedupeCount: counters.riskSnapshotDedupe,
    riskSnapshotWsRefreshCount: counters.riskSnapshotWsRefresh,
    riskSnapshotPollCount: counters.riskSnapshotPoll,
  };
}

export function exportBaselineJson(): string {
  return JSON.stringify(getBaselineSnapshot(), null, 2);
}

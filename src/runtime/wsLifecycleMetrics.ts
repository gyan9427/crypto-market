const metrics = {
  duplicateWsConnections: 0,
  reconnectFrequency: 0,
  subscriptionDuplication: 0,
  reconnectStormEvents: 0,
};

const reconnectTimestamps: number[] = [];

const devTrace =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_PERF_TRACE === 'true';

export function recordWsDuplicateConnection(): void {
  metrics.duplicateWsConnections += 1;
}

export function recordWsReconnect(): void {
  metrics.reconnectFrequency += 1;
  const now = Date.now();
  reconnectTimestamps.push(now);
  const recent = reconnectTimestamps.filter((t) => now - t < 60_000);
  reconnectTimestamps.length = 0;
  reconnectTimestamps.push(...recent);
  if (recent.length >= 5) {
    metrics.reconnectStormEvents += 1;
  }
}

export function recordWsSubscriptionDuplicate(): void {
  metrics.subscriptionDuplication += 1;
}

export function getWsLifecycleMetrics(): Readonly<typeof metrics> {
  return { ...metrics };
}

export function resetWsLifecycleMetricsForTests(): void {
  metrics.duplicateWsConnections = 0;
  metrics.reconnectFrequency = 0;
  metrics.subscriptionDuplication = 0;
  metrics.reconnectStormEvents = 0;
  reconnectTimestamps.length = 0;
}

export function logWsLifecycleSummary(): void {
  if (devTrace) {
    console.log('[ws-metrics]', getWsLifecycleMetrics());
  }
}

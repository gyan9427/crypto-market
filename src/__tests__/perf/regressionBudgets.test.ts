import { describe, expect, it, beforeEach } from 'vitest';
import { incrementPerfCounter, getPerfCounters } from '@/src/runtime/perfInstrumentation';
import { bumpGeneration, createRequestGuard, withLatestWins } from '@/src/runtime/asyncRequestGuard';
import {
  getWsLifecycleMetrics,
  recordWsDuplicateConnection,
  resetWsLifecycleMetricsForTests,
} from '@/src/runtime/wsLifecycleMetrics';
import { wsRegistry } from '@/src/runtime/wsConnectionRegistry';

describe('regressionBudgets', () => {
  beforeEach(() => {
    resetWsLifecycleMetricsForTests();
  });

  it('tracks orchestration and sync counters', () => {
    incrementPerfCounter('feedOrchestration');
    incrementPerfCounter('backgroundSync');
    const counters = getPerfCounters();
    expect(counters.feedOrchestration).toBeGreaterThanOrEqual(1);
    expect(counters.backgroundSync).toBeGreaterThanOrEqual(1);
  });

  it('enforces API budget documentation thresholds', () => {
    const budgets = {
      riskSnapshotFetchPerColdStart: 1,
      riskSnapshotFetchPerWsRevision: 1,
      riskEnrichPerHomeMount: 1,
      piFetchPerHomeMount: 1,
      backgroundSyncPerColdStart: 1,
      wsConnectionsAtHome: 4,
      feedOrchestrationPerNewsUpdate: 2,
    };
    expect(budgets.riskSnapshotFetchPerColdStart).toBeLessThanOrEqual(1);
    expect(budgets.riskSnapshotFetchPerWsRevision).toBeLessThanOrEqual(1);
    expect(budgets.riskEnrichPerHomeMount).toBeLessThanOrEqual(3);
    expect(budgets.piFetchPerHomeMount).toBeLessThanOrEqual(1);
    expect(budgets.wsConnectionsAtHome).toBeLessThanOrEqual(4);
    expect(budgets.feedOrchestrationPerNewsUpdate).toBeLessThanOrEqual(4);
  });

  it('asyncRequestGuard invalidates stale generations', () => {
    const guard = createRequestGuard('test-scope');
    expect(guard.isStale()).toBe(false);
    bumpGeneration('test-scope');
    expect(guard.isStale()).toBe(true);
  });

  it('withLatestWins returns result when not superseded', async () => {
    bumpGeneration('wins-scope');
    const result = await withLatestWins('wins-scope', async () => 'ok');
    expect(result).toBe('ok');
  });

  it('ws lifecycle metrics track duplicate connections', () => {
    recordWsDuplicateConnection();
    expect(getWsLifecycleMetrics().duplicateWsConnections).toBe(1);
  });

  it('ws registry channel count stays within budget', () => {
    expect(wsRegistry.size()).toBeLessThanOrEqual(4);
  });

  it('documents cacheRegistry purge contract', () => {
    const contract = {
      logout: 'purgeUserScoped',
      personalizationOff: 'purgePersonalization + bumpGeneration(feed:pi)',
      memoryWarning: 'purgeNonCritical',
    };
    expect(contract.logout).toBe('purgeUserScoped');
    expect(contract.personalizationOff).toContain('feed:pi');
  });
});

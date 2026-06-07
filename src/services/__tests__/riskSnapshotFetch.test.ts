import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/src/config/apiBaseUrl', () => ({
  resolveApiBaseUrl: () => 'https://api.test/api',
}));

vi.mock('@/src/runtime/perfInstrumentation', () => ({
  incrementPerfCounter: vi.fn(),
  getPerfCounters: vi.fn(() => ({
    riskSnapshotFetch: 1,
    riskSnapshotDedupe: 2,
  })),
}));

import {
  fetchRiskSnapshotCoalesced,
  resetRiskSnapshotInflightForTests,
} from '@/src/services/riskSnapshotFetch';
import { getPerfCounters } from '@/src/runtime/perfInstrumentation';

vi.mock('@/src/services/requestCache', () => ({
  fetchJsonCached: vi.fn(async () => ({
    success: true,
    meta: { revision: 1, buildId: 'b1', buildFingerprint: 'fp', computedAt: null, stale: false, partial: false },
    data: {
      revision: 1,
      buildId: 'b1',
      buildFingerprint: 'fp',
      computedAt: '2026-01-01T00:00:00.000Z',
      partial: false,
      stale: false,
      marketRegime: 'normal',
      universeSize: 1,
      coins: [],
    },
    manifest: { complete: true },
  })),
}));

describe('fetchRiskSnapshotCoalesced', () => {
  beforeEach(() => {
    resetRiskSnapshotInflightForTests();
    vi.clearAllMocks();
  });

  it('collapses concurrent callers into one fetch', async () => {
    const [a, b, c] = await Promise.all([
      fetchRiskSnapshotCoalesced(),
      fetchRiskSnapshotCoalesced(),
      fetchRiskSnapshotCoalesced(),
    ]);

    expect(a.meta.revision).toBe(1);
    expect(b.meta.revision).toBe(1);
    expect(c.meta.revision).toBe(1);

    const counters = getPerfCounters();
    expect(counters.riskSnapshotFetch).toBe(1);
    expect(counters.riskSnapshotDedupe).toBeGreaterThanOrEqual(2);
  });
});

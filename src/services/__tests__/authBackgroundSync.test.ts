import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  runAuthBackgroundSync,
  runAuthBackgroundSyncDebounced,
  resetAuthBackgroundSync,
} from '@/src/services/authBackgroundSync';

const syncLanguageFromServer = vi.fn().mockResolvedValue(undefined);
const retryLanguageSync = vi.fn().mockResolvedValue(undefined);
const syncFollowingCoins = vi.fn().mockResolvedValue(undefined);

vi.mock('@/src/state/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ isAuthenticated: true })),
  },
}));

vi.mock('@/src/state/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      syncLanguageFromServer,
      retryLanguageSync,
      syncFollowingCoins,
    })),
  },
}));

describe('authBackgroundSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthBackgroundSync();
  });

  it('dedupes concurrent sync calls', async () => {
    const p1 = runAuthBackgroundSync();
    const p2 = runAuthBackgroundSync();
    expect(p1).toBe(p2);
    await p1;
    expect(syncFollowingCoins).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid foreground sync', async () => {
    await runAuthBackgroundSync();
    syncFollowingCoins.mockClear();
    runAuthBackgroundSyncDebounced(60_000);
    expect(syncFollowingCoins).not.toHaveBeenCalled();
  });
});

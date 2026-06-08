import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useFeaturesStore, isOnboardingFeatureEnabled } from '@/src/utils/features';
import { completeCoinOnboarding, getCurrentUser } from '@/src/services/api';
import { CoinOnboardingModal } from './CoinOnboardingModal';
import { withLatestWins } from '@/src/runtime/asyncRequestGuard';

/**
 * Blocks the app with coin-picker onboarding until the user follows ≥5 coins
 * and the server marks `coinOnboardingCompleted`.
 */
export function CoinOnboardingGate(): React.ReactElement | null {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const featuresLoaded = useFeaturesStore((s) => s.loaded);
  const followingCoins = useAppStore((s) => s.followingCoins);
  const syncFollowingCoins = useAppStore((s) => s.syncFollowingCoins);
  const setFeedFilter = useAppStore((s) => s.setFeedFilter);

  const [evaluated, setEvaluated] = useState(false);
  const [visible, setVisible] = useState(false);

  const evaluate = useCallback(async () => {
    if (!isAuthenticated || !featuresLoaded || user?.emailVerified !== true) {
      setEvaluated(false);
      setVisible(false);
      return;
    }

    if (!isOnboardingFeatureEnabled()) {
      setEvaluated(true);
      setVisible(false);
      return;
    }

    try {
      if (followingCoins.length === 0) {
        await syncFollowingCoins();
      }

      if (user?.coinOnboardingCompleted !== undefined) {
        setVisible(user.coinOnboardingCompleted !== true);
      } else {
        const fresh = await withLatestWins('onboarding:eval', async () => getCurrentUser());
        setVisible(fresh?.coinOnboardingCompleted !== true);
      }
    } catch {
      setVisible(user?.coinOnboardingCompleted !== true);
    } finally {
      setEvaluated(true);
    }
  }, [
    isAuthenticated,
    featuresLoaded,
    followingCoins.length,
    syncFollowingCoins,
    user?.coinOnboardingCompleted,
    user?.emailVerified,
  ]);

  useEffect(() => {
    setEvaluated(false);
    void evaluate();
  }, [evaluate, user?.id]);

  const handleComplete = useCallback(
    async (coinIds: string[]) => {
      await completeCoinOnboarding(coinIds);
      await syncFollowingCoins();
      setFeedFilter('following');
      setVisible(false);
    },
    [syncFollowingCoins, setFeedFilter]
  );

  if (!isAuthenticated || !evaluated) {
    return null;
  }

  return <CoinOnboardingModal visible={visible} onComplete={handleComplete} />;
}

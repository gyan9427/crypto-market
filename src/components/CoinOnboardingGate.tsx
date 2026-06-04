import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useFeaturesStore, isOnboardingFeatureEnabled } from '@/src/utils/features';
import { completeCoinOnboarding, getCurrentUser } from '@/src/services/api';
import { CoinOnboardingModal } from './CoinOnboardingModal';

/**
 * Blocks the app with coin-picker onboarding until the user follows ≥5 coins
 * and the server marks `coinOnboardingCompleted`.
 */
export function CoinOnboardingGate(): React.ReactElement | null {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const featuresLoaded = useFeaturesStore((s) => s.loaded);
  const syncFollowingCoins = useAppStore((s) => s.syncFollowingCoins);
  const setFeedFilter = useAppStore((s) => s.setFeedFilter);

  const [evaluated, setEvaluated] = useState(false);
  const [visible, setVisible] = useState(false);

  const evaluate = useCallback(async () => {
    if (!isAuthenticated || !featuresLoaded) {
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
      await syncFollowingCoins();
      const fresh = await getCurrentUser();
      setVisible(fresh.coinOnboardingCompleted !== true);
    } catch {
      setVisible(user?.coinOnboardingCompleted !== true);
    } finally {
      setEvaluated(true);
    }
  }, [isAuthenticated, featuresLoaded, syncFollowingCoins, user?.coinOnboardingCompleted]);

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

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { useHasFeature } from '@/src/utils/features';
import { canUsePersonalization } from '@/src/privacy/consentStore';
import { syncInterestProfileSignals } from '@/src/services/interestProfileApi';

export function useInterestProfileSync(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasInterestProfile = useHasFeature('interest_profile_engine');
  const recentReadArticleIds = useFeedIntentStore((s) => s.recentReadArticleIds);
  const recentSearchSymbols = useFeedIntentStore((s) => s.recentSearchSymbols);
  const dwellTimeBuckets = useFeedIntentStore((s) => s.dwellTimeBuckets);
  const hydrated = useFeedIntentStore((s) => s.hydrated);
  const lastSyncKey = useRef('');

  useEffect(() => {
    if (!isAuthenticated || !hasInterestProfile || !hydrated || !canUsePersonalization()) {
      return;
    }

    const syncKey = [
      recentReadArticleIds.join(','),
      recentSearchSymbols.join(','),
      JSON.stringify(dwellTimeBuckets),
    ].join('|');
    if (syncKey === lastSyncKey.current) return;

    const timer = setTimeout(() => {
      lastSyncKey.current = syncKey;
      void syncInterestProfileSignals({
        readArticleIds: recentReadArticleIds,
        searchedSymbols: recentSearchSymbols,
        dwellTimeBuckets,
      });
    }, 2_000);

    return () => clearTimeout(timer);
  }, [
    isAuthenticated,
    hasInterestProfile,
    hydrated,
    recentReadArticleIds,
    recentSearchSymbols,
    dwellTimeBuckets,
  ]);
}

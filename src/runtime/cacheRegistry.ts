import {
  clearPortfolioContextCache,
  invalidatePortfolioContextCache,
} from '@/src/services/portfolioContextCache';
import { invalidateMemoryCacheByPrefix, purgeRequestCacheAll } from '@/src/services/requestCache';
import { clearRuntimeHintsCache } from '@/src/services/runtimeHintsCache';
import { bumpGeneration } from '@/src/runtime/asyncRequestGuard';

type Invalidator = () => void;

const registrants = new Map<string, Invalidator>();
let lifecycleStarted = false;

export const cacheRegistry = {
  register(key: string, invalidate: Invalidator): void {
    registrants.set(key, invalidate);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[cacheRegistry] register', key);
    }
  },

  purgeUserScoped(): void {
    purgeRequestCacheAll();
    clearPortfolioContextCache();
    clearRuntimeHintsCache();
    bumpGeneration('feed:pi');
    bumpGeneration('feed:risk-enrich');
    bumpGeneration('runtime:hints');
    for (const fn of registrants.values()) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  },

  purgePersonalization(): void {
    invalidatePortfolioContextCache();
    invalidateMemoryCacheByPrefix('portfolio/intelligence');
    invalidateMemoryCacheByPrefix('pi:');
    bumpGeneration('feed:pi');
    try {
      registrants.get('feed:pi')?.();
    } catch {
      /* ignore */
    }
  },

  purgeOnAuthChange(_tokenKey: string): void {
    invalidatePortfolioContextCache();
    purgeRequestCacheAll();
  },

  /** Drop non-critical caches on memory pressure — keep auth token and risk snapshot. */
  purgeNonCritical(): void {
    clearRuntimeHintsCache();
    bumpGeneration('runtime:hints');
    invalidateMemoryCacheByPrefix('/public/runtime-hints');
    invalidateMemoryCacheByPrefix('runtime');
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[cacheRegistry] purgeNonCritical');
    }
  },
};

/** Register AppState memory-warning listener once at app boot. */
export function initCacheRegistryLifecycle(): void {
  if (lifecycleStarted) return;
  lifecycleStarted = true;

  // Lazy require — keeps unit tests Node-compatible
  const { AppState } = require('react-native') as typeof import('react-native');
  AppState.addEventListener('change', (nextState) => {
    if (nextState === ('memoryWarning' as typeof nextState)) {
      cacheRegistry.purgeNonCritical();
    }
  });
}

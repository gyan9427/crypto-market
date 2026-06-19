import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/src/services/apiBase';
import { getAppVersion, isAppVersionBelowMin } from '@/src/config/appVersion';
import { fetchJsonCached } from '@/src/services/requestCache';
import { createRequestGuard, bumpGeneration } from '@/src/runtime/asyncRequestGuard';
import {
  clearRuntimeHintsCache as clearRuntimeHintsCacheState,
  getRuntimeHintsCached,
  getRuntimeHintsCachedAt,
  setRuntimeHintsCache,
  type RuntimeHints,
} from '@/src/services/runtimeHintsCache';

export type { RuntimeHints } from '@/src/services/runtimeHintsCache';

const CLIENT_TTL_MS = 5 * 60 * 1000;

async function fetchHints(signal?: AbortSignal): Promise<RuntimeHints> {
  const url = `${API_BASE_URL}/public/runtime-hints`;
  const json = await fetchJsonCached<{ data?: RuntimeHints }>(url, {
    cacheTtlMs: CLIENT_TTL_MS,
    signal,
  });
  const data = json.data ?? (json as unknown as RuntimeHints);
  const hints: RuntimeHints = {
    minAppVersion: data.minAppVersion ?? '1.0.0',
    wsProtocolV2Required: Boolean(data.wsProtocolV2Required),
    eventsSchemaEnforcement: data.eventsSchemaEnforcement ?? 'log',
  };
  setRuntimeHintsCache(hints);
  return hints;
}

export { getRuntimeHintsCached } from '@/src/services/runtimeHintsCache';

export function clearRuntimeHintsCache(): void {
  clearRuntimeHintsCacheState();
  bumpGeneration('runtime:hints');
}

export async function refreshRuntimeHintsIfStale(): Promise<void> {
  const cachedHints = getRuntimeHintsCached();
  const cachedAt = getRuntimeHintsCachedAt();
  if (cachedHints && Date.now() - cachedAt < CLIENT_TTL_MS) return;
  const guard = createRequestGuard('runtime:hints');
  try {
    await fetchHints(guard.signal);
  } catch {
    /* keep last known */
  }
}

export function useRuntimeHints(isReady = true): {
  hints: RuntimeHints | null;
  forceUpgrade: boolean;
  refresh: () => Promise<void>;
} {
  const [hints, setHints] = useState<RuntimeHints | null>(getRuntimeHintsCached());
  const [forceUpgrade, setForceUpgrade] = useState(false);

  const refresh = async (): Promise<void> => {
    if (!isReady) return;
    const cachedHints = getRuntimeHintsCached();
    const cachedAt = getRuntimeHintsCachedAt();
    if (cachedHints && Date.now() - cachedAt < CLIENT_TTL_MS) {
      setHints(cachedHints);
      setForceUpgrade(!__DEV__ && isAppVersionBelowMin(cachedHints.minAppVersion));
      return;
    }
    const guard = createRequestGuard('runtime:hints');
    try {
      const h = await fetchHints(guard.signal);
      if (guard.isStale()) return;
      setHints(h);
      setForceUpgrade(!__DEV__ && isAppVersionBelowMin(h.minAppVersion));
    } catch {
      /* keep last known */
    }
  };

  useEffect(() => {
    if (!isReady) return;
    void refresh();
    return () => bumpGeneration('runtime:hints');
  }, [isReady]);

  return { hints, forceUpgrade, refresh };
}

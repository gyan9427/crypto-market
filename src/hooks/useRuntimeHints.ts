import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { API_BASE_URL } from '@/src/services/api';
import { getAppVersion, isAppVersionBelowMin } from '@/src/config/appVersion';

export interface RuntimeHints {
  minAppVersion: string;
  wsProtocolV2Required: boolean;
  eventsSchemaEnforcement: string;
}

let cachedHints: RuntimeHints | null = null;

async function fetchHints(): Promise<RuntimeHints> {
  const res = await fetch(`${API_BASE_URL}/public/runtime-hints`);
  if (!res.ok) throw new Error('runtime hints unavailable');
  const json = (await res.json()) as { data?: RuntimeHints };
  const data = json.data ?? (json as unknown as RuntimeHints);
  cachedHints = {
    minAppVersion: data.minAppVersion ?? '1.0.0',
    wsProtocolV2Required: Boolean(data.wsProtocolV2Required),
    eventsSchemaEnforcement: data.eventsSchemaEnforcement ?? 'log',
  };
  return cachedHints;
}

export function getRuntimeHintsCached(): RuntimeHints | null {
  return cachedHints;
}

export function useRuntimeHints(): {
  hints: RuntimeHints | null;
  forceUpgrade: boolean;
  refresh: () => Promise<void>;
} {
  const [hints, setHints] = useState<RuntimeHints | null>(cachedHints);
  const [forceUpgrade, setForceUpgrade] = useState(false);

  const refresh = async (): Promise<void> => {
    try {
      const h = await fetchHints();
      setHints(h);
      setForceUpgrade(isAppVersionBelowMin(h.minAppVersion));
    } catch {
      /* keep last known */
    }
  };

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, []);

  return { hints, forceUpgrade, refresh };
}

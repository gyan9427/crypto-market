import { create } from 'zustand';
import { API_BASE_URL } from '../services/api';

interface FeaturesState {
  features: Set<string>;
  loaded: boolean;
  loadFeatures: () => Promise<void>;
  refetchFeatures: () => Promise<void>;
}

export const useFeaturesStore = create<FeaturesState>((set, get) => ({
  features: new Set(),
  loaded: false,

  loadFeatures: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch(`${API_BASE_URL}/features`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.features)) {
        set({ features: new Set(data.data.features), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  refetchFeatures: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/features`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data?.data?.features)) {
        set({ features: new Set(data.data.features), loaded: true });
      }
    } catch {
      // Keep existing state on refetch error
    }
  },
}));

/**
 * Check if a feature is available (non-reactive). Use useHasFeature in components for reactivity.
 * By default returns true if features not yet loaded (fail-open for backwards compatibility).
 */
export function hasFeature(featureKey: string): boolean {
  const { features, loaded } = useFeaturesStore.getState();
  if (!loaded) return true; // Fail-open: assume enabled until we know
  return features.has(featureKey);
}

/**
 * Reactive hook - component re-renders when features change. Use for feature-gated UI.
 */
export function useHasFeature(featureKey: string): boolean {
  const features = useFeaturesStore((s) => s.features);
  const loaded = useFeaturesStore((s) => s.loaded);
  if (!loaded) return true; // Fail-open
  return features.has(featureKey);
}

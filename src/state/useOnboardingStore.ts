import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAS_SEEN_KEY = '@nayft_has_seen_onboarding';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setHasSeenOnboarding: (seen: boolean) => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(HAS_SEEN_KEY);
      set({
        hasSeenOnboarding: v === '1',
        hydrated: true,
      });
    } catch {
      set({ hasSeenOnboarding: false, hydrated: true });
    }
  },

  setHasSeenOnboarding: async (seen: boolean) => {
    try {
      if (seen) {
        await AsyncStorage.setItem(HAS_SEEN_KEY, '1');
      } else {
        await AsyncStorage.removeItem(HAS_SEEN_KEY);
      }
    } catch {
      /* ignore */
    }
    set({ hasSeenOnboarding: seen });
  },
}));

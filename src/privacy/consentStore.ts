import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@nayft_privacy_consent_v1';

export interface PrivacyConsentState {
  analyticsConsent: boolean;
  personalizationConsent: boolean;
  consentDecided: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAnalyticsConsent: (value: boolean) => Promise<void>;
  setPersonalizationConsent: (value: boolean) => Promise<void>;
  acceptAll: () => Promise<void>;
  rejectAnalytics: () => Promise<void>;
}

interface StoredConsent {
  analyticsConsent: boolean;
  personalizationConsent: boolean;
  consentDecided: boolean;
}

export const useConsentStore = create<PrivacyConsentState>((set, get) => ({
  analyticsConsent: false,
  personalizationConsent: true,
  consentDecided: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CONSENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredConsent;
        set({
          analyticsConsent: Boolean(parsed.analyticsConsent),
          personalizationConsent: parsed.personalizationConsent !== false,
          consentDecided: Boolean(parsed.consentDecided),
          hydrated: true,
        });
        return;
      }
    } catch {
      /* fall through */
    }
    const defaults: StoredConsent = {
      analyticsConsent: false,
      personalizationConsent: true,
      consentDecided: true,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(defaults));
    set({ ...defaults, hydrated: true });
  },

  setAnalyticsConsent: async (value: boolean) => {
    const next = {
      analyticsConsent: value,
      personalizationConsent: get().personalizationConsent,
      consentDecided: true,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    set(next);
  },

  setPersonalizationConsent: async (value: boolean) => {
    const next = {
      analyticsConsent: get().analyticsConsent,
      personalizationConsent: value,
      consentDecided: true,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    set(next);
  },

  acceptAll: async () => {
    const next = {
      analyticsConsent: true,
      personalizationConsent: true,
      consentDecided: true,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    set(next);
  },

  rejectAnalytics: async () => {
    const next = {
      analyticsConsent: false,
      personalizationConsent: get().personalizationConsent,
      consentDecided: true,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    set(next);
  },
}));

export function canTrackAnalytics(): boolean {
  const s = useConsentStore.getState();
  return s.hydrated && s.consentDecided && s.analyticsConsent;
}

export function canUsePersonalization(): boolean {
  const s = useConsentStore.getState();
  if (!s.hydrated || !s.consentDecided) return false;
  return s.personalizationConsent;
}

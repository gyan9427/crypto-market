import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { useOnboardingStore } from '@/src/state/useOnboardingStore';
import { trackEvent } from '@/src/utils/trackEvent';

export function useOnboarding() {
  const router = useRouter();
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding);

  const trackScreenView = useCallback((slideIndex: number) => {
    trackEvent({
      featureKey: 'onboarding',
      eventType: 'screen_view',
      metadata: { slideIndex },
    });
  }, []);

  const trackSlideChanged = useCallback((from: number, to: number) => {
    trackEvent({
      featureKey: 'onboarding',
      eventType: 'slide_changed',
      metadata: { from, to },
    });
  }, []);

  const trackNextPressed = useCallback((slideIndex: number, isLast: boolean) => {
    trackEvent({
      featureKey: 'onboarding',
      eventType: 'next_pressed',
      metadata: { slideIndex, isLast },
    });
  }, []);

  const completeOnboarding = useCallback(
    async (slideIndex: number) => {
      trackEvent({
        featureKey: 'onboarding',
        eventType: 'completed',
        metadata: { slideIndex },
      });
      await setHasSeenOnboarding(true);
      router.replace('/login' as Href);
    },
    [router, setHasSeenOnboarding]
  );

  const skipOnboarding = useCallback(
    async (slideIndex: number) => {
      trackEvent({
        featureKey: 'onboarding',
        eventType: 'skipped',
        metadata: { slideIndex },
      });
      await setHasSeenOnboarding(true);
      router.replace('/login' as Href);
    },
    [router, setHasSeenOnboarding]
  );

  return {
    completeOnboarding,
    skipOnboarding,
    trackScreenView,
    trackSlideChanged,
    trackNextPressed,
  };
}

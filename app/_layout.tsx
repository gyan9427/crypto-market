import '@/src/i18n';
import '@/src/polyfills/devtools';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { AppState, InteractionManager, Platform, View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, useAppTheme } from '@/src/theme/ThemeProvider';
import { GlobalErrorBoundary } from '@/src/components/GlobalErrorBoundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useOnboardingStore } from '@/src/state/useOnboardingStore';
import { useSplashStore } from '@/src/state/useSplashStore';
import { useFeaturesStore, isOnboardingFeatureEnabled } from '@/src/utils/features';
import { NotificationsGatewayHost } from '@/src/components/NotificationsGatewayHost';

const RootView = Platform.OS === 'android'
  ? View
  : require('react-native-gesture-handler').GestureHandlerRootView;

function RootLayoutContent({ isReady }: { isReady: boolean }) {
  const { tokens } = useAppTheme();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg }} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <NotificationsGatewayHost />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);
  const hydrateThemePreference = useAppStore((state) => state.hydrateThemePreference);
  const hydrateLanguage = useAppStore((state) => state.hydrateLanguage);
  const syncLanguageFromServer = useAppStore((state) => state.syncLanguageFromServer);
  const retryLanguageSync = useAppStore((state) => state.retryLanguageSync);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const featuresLoaded = useFeaturesStore((state) => state.loaded);
  const splashDone = useSplashStore((state) => state.done);
  const [isReady, setIsReady] = useState(false);
  const authSyncInFlightRef = useRef<Promise<void> | null>(null);

  const runAuthenticatedBackgroundSync = useCallback(() => {
    if (!useAuthStore.getState().isAuthenticated) return Promise.resolve();
    if (authSyncInFlightRef.current) return authSyncInFlightRef.current;

    const task = Promise.allSettled([
      syncLanguageFromServer(),
      retryLanguageSync(),
      syncFollowingCoins(),
    ]).then(() => undefined);

    authSyncInFlightRef.current = task.finally(() => {
      authSyncInFlightRef.current = null;
    });

    return authSyncInFlightRef.current;
  }, [retryLanguageSync, syncFollowingCoins, syncLanguageFromServer]);

  useEffect(() => {
    Promise.all([
      initializeAuth().catch((err) => {
        console.error('initializeAuth failed:', err);
      }),
      useOnboardingStore.getState().hydrate(),
      useFeaturesStore.getState().loadFeatures(),
      hydrateThemePreference(),
      hydrateLanguage(),
    ]).then(() => {
      setIsReady(true);
      InteractionManager.runAfterInteractions(() => {
        void runAuthenticatedBackgroundSync();
      });
    });
  }, [
    initializeAuth,
    hydrateThemePreference,
    hydrateLanguage,
    runAuthenticatedBackgroundSync,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        useFeaturesStore.getState().refetchFeatures();
        if (useAuthStore.getState().isAuthenticated) {
          void runAuthenticatedBackgroundSync();
        }
      }
    });
    return () => subscription.remove();
  }, [runAuthenticatedBackgroundSync]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    void runAuthenticatedBackgroundSync();
  }, [isReady, isAuthenticated, runAuthenticatedBackgroundSync]);

  useEffect(() => {
    if (!isReady || !onboardingHydrated || !featuresLoaded) return;

    const firstSegment = segments[0] as string | undefined;

    // Animated splash is session-only (Zustand resets on each JS reload). After refresh,
    // `splashDone` is false again — but restoring auth from AsyncStorage means the user is
    // already logged in; do not send them through splash again (fixes web reload).
    const shouldGateWithSplash = !splashDone && !isAuthenticated;

    if (shouldGateWithSplash) {
      if (firstSegment !== 'splash') router.replace('/splash' as Href);
      return;
    }

    if (firstSegment === 'splash') {
      if (isAuthenticated) router.replace('/(tabs)');
      else if (!hasSeenOnboarding && isOnboardingFeatureEnabled())
        router.replace('/onboarding' as Href);
      else router.replace('/login');
      return;
    }

    if (isAuthenticated) {
      if (
        firstSegment === 'login' ||
        firstSegment === 'register' ||
        firstSegment === 'onboarding' ||
        firstSegment === 'splash'
      ) {
        router.replace('/(tabs)');
      }
      return;
    }

    if (hasSeenOnboarding && firstSegment === 'onboarding') {
      router.replace('/login');
      return;
    }

    if (!hasSeenOnboarding && isOnboardingFeatureEnabled()) {
      if (firstSegment !== 'onboarding' && firstSegment !== 'register') {
        router.replace('/onboarding' as Href);
      }
      return;
    }

    const isPublicAuth =
      firstSegment === 'login' || firstSegment === 'register' || firstSegment === 'onboarding';
    if (!isPublicAuth) {
      router.replace('/login');
    }
  }, [
    isReady,
    onboardingHydrated,
    featuresLoaded,
    splashDone,
    isAuthenticated,
    hasSeenOnboarding,
    segments,
    router,
  ]);

  return (
    <RootView style={{ flex: 1 }}>
      <ThemeProvider>
        <GlobalErrorBoundary>
          <BottomSheetModalProvider>
            <RootLayoutContent isReady={isReady} />
          </BottomSheetModalProvider>
        </GlobalErrorBoundary>
      </ThemeProvider>
    </RootView>
  );
}

import '@/src/i18n';
import '@/src/polyfills/devtools';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { AppState, InteractionManager, Platform, View } from 'react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, useAppTheme } from '@/src/theme/ThemeProvider';
import { GlobalErrorBoundary } from '@/src/components/GlobalErrorBoundary';
import { installGlobalErrorHandlers } from '@/src/errors/installGlobalErrorHandlers';

installGlobalErrorHandlers();
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useSplashStore } from '@/src/state/useSplashStore';
import { useFeaturesStore } from '@/src/utils/features';
import { NotificationsGatewayHost } from '@/src/components/NotificationsGatewayHost';
import { RiskGatewayHost } from '@/src/components/RiskGatewayHost';
import { CoinOnboardingGate } from '@/src/components/CoinOnboardingGate';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';

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
        <Stack.Screen name="+not-found" />
      </Stack>
      <NotificationsGatewayHost />
      <RiskGatewayHost />
      <CoinOnboardingGate />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);
  const hydrateThemePreference = useAppStore((state) => state.hydrateThemePreference);
  const hydrateLanguage = useAppStore((state) => state.hydrateLanguage);
  const syncLanguageFromServer = useAppStore((state) => state.syncLanguageFromServer);
  const retryLanguageSync = useAppStore((state) => state.retryLanguageSync);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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
      useFeaturesStore.getState().loadFeatures(),
      hydrateThemePreference(),
      hydrateLanguage(),
      useFeedIntentStore.getState().hydrate(),
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
    if (!isReady || !featuresLoaded) return;

    const firstSegment = segments[0] as string | undefined;

    // Splash is session-only. After JS reload, splashDone resets but auth restores from
    // AsyncStorage — skip splash for already-authenticated users (fixes web reload regression).
    const shouldGateWithSplash = !splashDone && !isAuthenticated;

    if (shouldGateWithSplash) {
      if (firstSegment !== 'splash') router.replace('/splash' as Href);
      return;
    }

    if (firstSegment === 'splash') {
      if (!isAuthenticated) {
        router.replace('/login' as Href);
      } else {
        router.replace('/(tabs)' as Href);
      }
      return;
    }

    // Unauthenticated: only login and register are public.
    if (!isAuthenticated) {
      const isPublicRoute = firstSegment === 'login' || firstSegment === 'register';
      if (!isPublicRoute) router.replace('/login' as Href);
      return;
    }

    // Authenticated → redirect away from auth screens.
    if (firstSegment === 'login' || firstSegment === 'register') {
      router.replace('/(tabs)' as Href);
    }
  }, [
    isReady,
    featuresLoaded,
    splashDone,
    isAuthenticated,
    segments,
    router,
  ]);

  return (
    <RootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <RootLayoutContent isReady={isReady} />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </RootView>
  );
}

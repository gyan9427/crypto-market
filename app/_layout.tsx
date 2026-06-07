import '@/src/i18n';
import '@/src/polyfills/devtools';
import { useEffect, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { AppState, Platform, View } from 'react-native';
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
import { CoinOnboardingGate } from '@/src/components/CoinOnboardingGate';
import { RiskGatewayHost } from '@/src/components/RiskGatewayHost';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { useConsentStore } from '@/src/privacy/consentStore';
import { useRuntimeHints } from '@/src/hooks/useRuntimeHints';
import { ForceUpgradeGate } from '@/src/components/ForceUpgradeGate';
import { isTieredStartupEnabled } from '@/src/config/featureFlags';
import {
  markStartupTier1Begin,
  markStartupTier1End,
  recordBaselineSnapshot,
  getBaselineSnapshot,
} from '@/src/runtime/perfInstrumentation';
import { runAuthBackgroundSync } from '@/src/services/authBackgroundSync';
import { scheduleAppForegroundRefresh } from '@/src/services/appForegroundRefresh';
import { enqueueBackgroundTask } from '@/src/runtime/backgroundTaskQueue';
import { initCacheRegistryLifecycle } from '@/src/runtime/cacheRegistry';
import { initWsRegistryLifecycle } from '@/src/runtime/wsConnectionRegistry';

const RootView = Platform.OS === 'android'
  ? View
  : require('react-native-gesture-handler').GestureHandlerRootView;

function RootLayoutContent({ isReady }: { isReady: boolean }) {
  const { tokens } = useAppTheme();
  const { forceUpgrade } = useRuntimeHints(isReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg }} />;
  }

  return (
    <>
      {isAuthenticated ? <RiskGatewayHost /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <CoinOnboardingGate />
      <ForceUpgradeGate visible={forceUpgrade} />
    </>
  );
}

function runTier2Hydration(): void {
  const hydrateThemePreference = useAppStore.getState().hydrateThemePreference;
  const hydrateLanguage = useAppStore.getState().hydrateLanguage;
  void Promise.allSettled([
    hydrateThemePreference(),
    hydrateLanguage(),
    useFeedIntentStore.getState().hydrate(),
    useConsentStore.getState().hydrate(),
  ]);
  enqueueBackgroundTask('low', () => useAuthStore.getState().migrateTokenToSecureStore());
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    initCacheRegistryLifecycle();
    initWsRegistryLifecycle();
  }, []);

  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const featuresLoaded = useFeaturesStore((state) => state.loaded);
  const splashDone = useSplashStore((state) => state.done);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tier1Start = markStartupTier1Begin();

    const finishReady = () => {
      markStartupTier1End(tier1Start);
      recordBaselineSnapshot(getBaselineSnapshot());
      setIsReady(true);
      if (isTieredStartupEnabled()) {
        runTier2Hydration();
      }
      enqueueBackgroundTask('low', () => runAuthBackgroundSync());
    };

    if (isTieredStartupEnabled()) {
      Promise.all([
        initializeAuth().catch((err) => {
          console.error('initializeAuth failed:', err);
        }),
        useFeaturesStore.getState().loadFeatures(),
      ]).then(finishReady);
      return;
    }

    Promise.all([
      initializeAuth().catch((err) => {
        console.error('initializeAuth failed:', err);
      }),
      useFeaturesStore.getState().loadFeatures(),
      useAppStore.getState().hydrateThemePreference(),
      useAppStore.getState().hydrateLanguage(),
      useFeedIntentStore.getState().hydrate(),
      useConsentStore.getState().hydrate(),
    ]).then(finishReady);
  }, [initializeAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        scheduleAppForegroundRefresh();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    enqueueBackgroundTask('low', () => runAuthBackgroundSync());
  }, [isReady, isAuthenticated]);

  useEffect(() => {
    if (!isReady || !featuresLoaded) return;

    const firstSegment = segments[0] as string | undefined;

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

    if (!isAuthenticated) {
      const isPublicRoute = firstSegment === 'login' || firstSegment === 'register';
      if (!isPublicRoute) router.replace('/login' as Href);
      return;
    }

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

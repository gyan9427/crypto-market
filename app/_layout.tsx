import '@/src/i18n';
import '@/src/polyfills/devtools';
import { useEffect, useState } from 'react';
import { configureGoogleSignIn } from '@/src/services/googleSignIn';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { AppState, Platform, View, ActivityIndicator } from 'react-native';
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
import { ShareCardCaptureHost } from '@/src/components/share/ShareCardCaptureHost';
import { useShareDeepLinkHandler } from '@/src/hooks/useShareDeepLinkHandler';
import { isTieredStartupEnabled } from '@/src/config/featureFlags';
import {
  markStartupTier1Begin,
  markStartupTier1End,
  recordBaselineSnapshot,
  getBaselineSnapshot,
} from '@/src/runtime/perfInstrumentation';
import { runAuthBackgroundSync } from '@/src/services/authBackgroundSync';
import { scheduleAppForegroundRefresh } from '@/src/services/appForegroundRefresh';
import { hydrateMarketSnapshotStore } from '@/src/services/api';
import { enqueueBackgroundTask } from '@/src/runtime/backgroundTaskQueue';
import { initCacheRegistryLifecycle } from '@/src/runtime/cacheRegistry';
import { initWsRegistryLifecycle } from '@/src/runtime/wsConnectionRegistry';

const RootView =
  Platform.OS === 'android' || Platform.OS === 'web'
    ? View
    : require('react-native-gesture-handler').GestureHandlerRootView;

const STARTUP_DEADLINE_MS = 6_000;

function runStartupTasks(tasks: Array<Promise<unknown>>): Promise<void> {
  let settled = false;
  return new Promise((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    void Promise.allSettled(tasks).then(finish);
    setTimeout(finish, STARTUP_DEADLINE_MS);
  });
}

function RootLayoutContent({ isReady }: { isReady: boolean }) {
  const { tokens } = useAppTheme();
  const { forceUpgrade } = useRuntimeHints(isReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const emailVerified = useAuthStore((s) => s.user?.emailVerified === true);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated && emailVerified ? <RiskGatewayHost /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="notification-preferences" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="share/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {isAuthenticated && emailVerified ? <CoinOnboardingGate /> : null}
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
  enqueueBackgroundTask('low', () => hydrateMarketSnapshotStore());
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    configureGoogleSignIn({
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
  const emailVerified = useAuthStore((state) => state.user?.emailVerified === true);
  const featuresLoaded = useFeaturesStore((state) => state.loaded);
  const splashDone = useSplashStore((state) => state.done);
  const [isReady, setIsReady] = useState(false);

  useShareDeepLinkHandler(isReady);

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
      void runStartupTasks([
        initializeAuth().catch((err) => {
          console.error('initializeAuth failed:', err);
        }),
        useFeaturesStore.getState().loadFeatures(),
      ]).then(finishReady);
      return;
    }

    void runStartupTasks([
      initializeAuth().catch((err) => {
        console.error('initializeAuth failed:', err);
      }),
      useFeaturesStore.getState().loadFeatures(),
      useAppStore.getState().hydrateThemePreference(),
      useAppStore.getState().hydrateLanguage(),
      useFeedIntentStore.getState().hydrate(),
      useConsentStore.getState().hydrate(),
      hydrateMarketSnapshotStore(),
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
    if (!isReady) return;

    const firstSegment = segments[0] as string | undefined;
    const isShareRoute = firstSegment === 'share';

    if (!featuresLoaded) {
      if (!isAuthenticated && firstSegment !== 'login' && firstSegment !== 'register' && firstSegment !== 'splash') {
        router.replace('/login' as Href);
      }
      return;
    }

    const shouldGateWithSplash = !splashDone && !isAuthenticated;

    if (shouldGateWithSplash) {
      if (firstSegment !== 'splash') router.replace('/splash' as Href);
      return;
    }

    if (firstSegment === 'splash') {
      if (!isAuthenticated) {
        router.replace('/login' as Href);
      } else if (!emailVerified) {
        router.replace('/verify-email' as Href);
      } else {
        router.replace('/(tabs)' as Href);
      }
      return;
    }

    if (isShareRoute) {
      return;
    }

    if (!isAuthenticated) {
      const isPublicRoute = firstSegment === 'login' || firstSegment === 'register';
      if (!isPublicRoute) router.replace('/login' as Href);
      return;
    }

    if (!emailVerified) {
      if (firstSegment !== 'verify-email') {
        router.replace('/verify-email' as Href);
      }
      return;
    }

    if (firstSegment === 'login' || firstSegment === 'register' || firstSegment === 'verify-email') {
      router.replace('/(tabs)' as Href);
    }
  }, [
    isReady,
    featuresLoaded,
    splashDone,
    isAuthenticated,
    emailVerified,
    segments,
    router,
  ]);

  return (
    <RootView style={{ flex: 1 }}>
      <ShareCardCaptureHost />
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

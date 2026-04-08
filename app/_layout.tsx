import '@/src/polyfills/devtools';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { AppState, InteractionManager, Platform, View } from 'react-native';
import { ThemeProvider, useAppTheme } from '@/src/theme/ThemeProvider';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useOnboardingStore } from '@/src/state/useOnboardingStore';
import { useFeaturesStore, isOnboardingFeatureEnabled } from '@/src/utils/features';

const RootView = Platform.OS === 'android'
  ? View
  : require('react-native-gesture-handler').GestureHandlerRootView;

function RootLayoutContent({ isReady }: { isReady: boolean }) {
  const { tokens } = useAppTheme();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: tokens.bg }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);
  const hydrateThemePreference = useAppStore((state) => state.hydrateThemePreference);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated);
  const featuresLoaded = useFeaturesStore((state) => state.loaded);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      initializeAuth().catch((err) => {
        console.error('initializeAuth failed:', err);
      }),
      useOnboardingStore.getState().hydrate(),
      useFeaturesStore.getState().loadFeatures(),
      hydrateThemePreference(),
    ]).then(() => {
      setIsReady(true);
      InteractionManager.runAfterInteractions(() => {
        syncFollowingCoins();
      });
    });
  }, [initializeAuth, syncFollowingCoins, hydrateThemePreference]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        useFeaturesStore.getState().refetchFeatures();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isReady || !onboardingHydrated || !featuresLoaded) return;

    const firstSegment = segments[0] as string | undefined;

    if (isAuthenticated) {
      if (
        firstSegment === 'login' ||
        firstSegment === 'register' ||
        firstSegment === 'onboarding'
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
    isAuthenticated,
    hasSeenOnboarding,
    segments,
    router,
  ]);

  return (
    <RootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutContent isReady={isReady} />
      </ThemeProvider>
    </RootView>
  );
}

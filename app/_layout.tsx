import '@/src/polyfills/devtools';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppState, InteractionManager, Platform, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { useFeaturesStore } from '@/src/utils/features';

// GestureHandler pulls in Reanimated which crashes on Android (Expo Go).
// Use View on Android; GestureHandlerRootView on iOS.
const RootView = Platform.OS === 'android'
  ? View
  : require('react-native-gesture-handler').GestureHandlerRootView;

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const initializeAuth = useAuthStore((state) => state.initialize);
  const syncFollowingCoins = useAppStore((state) => state.syncFollowingCoins);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeAuth().then(() => {
      setIsReady(true);
      // Sync following coins after first paint to avoid blocking initial render
      InteractionManager.runAfterInteractions(() => {
        syncFollowingCoins();
        useFeaturesStore.getState().loadFeatures();
      });
    });
  }, [initializeAuth, syncFollowingCoins]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        useFeaturesStore.getState().refetchFeatures();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const firstSegment = segments[0] as string | undefined;
    const isAuthRoute = firstSegment === 'login' || firstSegment === 'register';

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, segments, router]);

  // Render minimal shell immediately; full Stack mounts when auth is ready
  if (!isReady) {
    return <RootView style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <RootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </RootView>
  );
}

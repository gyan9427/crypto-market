import '@/src/polyfills/devtools';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { InteractionManager, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
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
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_500Medium,
  });

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
  if (!isReady || !fontsLoaded) {
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
      <StatusBar style="auto" />
    </RootView>
  );
}

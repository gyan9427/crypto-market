import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';

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
    // Initialize auth on app start
    console.log('Initializing auth');
    initializeAuth().then(() => {
      // Sync following coins after auth is initialized
      console.log('Syncing following coins');
      syncFollowingCoins();
      console.log('Syncing following coins done');
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const firstSegment = segments[0] as string | undefined;
    const isAuthRoute = firstSegment === 'login' || firstSegment === 'register';

    if (!isAuthenticated && !isAuthRoute) {
      // User is not authenticated but is trying to access a protected route
      router.replace('/login');
    } else if (isAuthenticated && isAuthRoute) {
      // User is authenticated but is on an auth route
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, segments, router]);

  if (!isReady) {
    return null;
  }

  return (
    <RootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
          </>
        ) : (
          <>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </RootView>
  );
}

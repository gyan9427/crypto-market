import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from '@/src/screens/HomeScreen';
import { FeedContextProvider } from '@/src/context/FeedContext';
import { setPerformanceScreen } from '@/src/services/requestCache';
import { isFeedContextProviderEnabled } from '@/src/config/featureFlags';

export default function HomeTab() {
  useEffect(() => {
    setPerformanceScreen('Home');
  }, []);

  const body = <HomeScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      {isFeedContextProviderEnabled() ? (
        <FeedContextProvider>{body}</FeedContextProvider>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

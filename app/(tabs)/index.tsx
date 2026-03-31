import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from '@/src/screens/HomeScreen';
import { StatusBar } from 'expo-status-bar';
import { setPerformanceScreen } from '@/src/services/requestCache';

export default function HomeTab() {
  useEffect(() => {
    setPerformanceScreen('Home');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="dark" />
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

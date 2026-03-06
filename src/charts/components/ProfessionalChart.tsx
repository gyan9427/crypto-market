import React, { Suspense, lazy } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import type { KlineInterval } from '../types';

const SkiaChart = lazy(() => import('./SkiaChart'));

export interface ProfessionalChartProps {
  symbol: string;
  interval: KlineInterval;
  style?: object;
}

export function ProfessionalChart(props: ProfessionalChartProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webFallback, props.style]}>
        <Text style={styles.webFallbackText}>Chart available on native app</Text>
      </View>
    );
  }
  // Reanimated crashes on Android (Expo Go). Chart uses GestureHandler + Reanimated.
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.webFallback, props.style]}>
        <Text style={styles.webFallbackText}>Chart available on iOS</Text>
      </View>
    );
  }
  return (
    <Suspense fallback={<View style={[styles.webFallback, props.style]} />}>
      <SkiaChart {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  webFallbackText: {
    fontSize: 14,
    color: '#64748b',
  },
});

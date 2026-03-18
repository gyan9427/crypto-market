import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioScreen } from '@/src/screens/PortfolioScreen';
import { StyleSheet } from 'react-native';

export default function PortfolioTab() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <PortfolioScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

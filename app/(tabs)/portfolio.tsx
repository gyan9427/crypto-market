import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlaceholderScreen } from '@/src/screens/PlaceholderScreen';
import { StyleSheet } from 'react-native';

export default function PortfolioTab() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PlaceholderScreen title="Portfolio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

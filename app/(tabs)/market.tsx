import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreScreen } from '@/src/screens/ExploreScreen';
import { StyleSheet } from 'react-native';

export default function MarketTab() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ExploreScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

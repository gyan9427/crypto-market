import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { PlaceholderScreen } from '@/src/screens/PlaceholderScreen';

export default function RewardsTab() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <PlaceholderScreen title="Rewards" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

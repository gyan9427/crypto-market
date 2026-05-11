import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreScreen } from '@/src/screens/ExploreScreen';
import { StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function MarketTab() {
  const { tokens } = useAppTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.bg }]} edges={['left', 'right']}>
      <ExploreScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

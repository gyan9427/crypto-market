import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioScreen } from '@/src/screens/PortfolioScreen';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function PortfolioTab() {
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: tokens.bg,
        },
      }),
    [tokens.bg]
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <PortfolioScreen />
    </SafeAreaView>
  );
}

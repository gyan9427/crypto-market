import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortfolioIntelligenceScreen } from '@/src/screens/PortfolioIntelligenceScreen';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function PortfolioIntelligenceRoute() {
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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <PortfolioIntelligenceScreen />
    </SafeAreaView>
  );
}

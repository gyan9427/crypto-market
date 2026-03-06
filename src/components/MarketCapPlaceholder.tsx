import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';
import { ProfessionalChart } from '../charts/components/ProfessionalChart';

export const MarketCapPlaceholder: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Cap</Text>
      <View style={styles.chartContainer}>
        <ProfessionalChart symbol="BTCUSDT" interval="1h" style={styles.chart} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginHorizontal: 0,
    ...shadows.md,
    overflow: 'hidden',
  },
  chart: {
    flex: 1,
    minHeight: 200,
  },
});

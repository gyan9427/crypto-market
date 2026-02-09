import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme/theme';

export const MarketCapPlaceholder: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market Cap</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Market Cap data coming soon</Text>
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
  placeholder: {
    height: 200, // Approximate height matching FeaturedCarousel visual height
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginHorizontal: 0,
    ...shadows.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.neutral[500],
    fontWeight: '500',
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { borderRadius, shadows, spacing } from '../theme/theme';

export const TrendingCoinCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.coinInfo}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={styles.coinText}>
            <Skeleton width={60} height={16} style={styles.marginBottom} />
            <Skeleton width={80} height={13} />
          </View>
        </View>
        <Skeleton width={30} height={14} />
      </View>

      <View style={styles.priceRow}>
        <Skeleton width={100} height={18} style={styles.marginRight} />
        <Skeleton width={60} height={14} />
      </View>

      <Skeleton width={100} height={30} borderRadius={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coinText: {
    marginLeft: 10,
  },
  marginBottom: {
    marginBottom: 6,
  },
  marginRight: {
    marginRight: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
});

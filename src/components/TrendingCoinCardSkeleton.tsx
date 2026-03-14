import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { semantic, spacing } from '../theme/theme';

export const TrendingCoinCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Skeleton width={40} height={24} borderRadius={semantic.cardRadiusSmall} style={styles.badge} />
        <View style={styles.coinDetails}>
          <Skeleton width={60} height={14} style={styles.marginBottom} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <View style={styles.rightSection}>
        <Skeleton width={50} height={13} style={styles.marginBottom} />
        <Skeleton width={70} height={13} style={styles.marginBottom} />
        <Skeleton width={24} height={11} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: semantic.listMarginH,
    marginBottom: semantic.listGap,
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadiusSmall,
    padding: semantic.cardPadding,
    ...semantic.cardShadow,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    marginRight: spacing.sm,
  },
  coinDetails: {
    flex: 1,
  },
  marginBottom: {
    marginBottom: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
});

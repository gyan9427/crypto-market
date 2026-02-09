import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { borderRadius, shadows, spacing } from '../theme/theme';

export const NewsCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={styles.headerText}>
            <Skeleton width={80} height={14} style={styles.marginBottom} />
            <Skeleton width={60} height={12} />
          </View>
        </View>
        <Skeleton width={70} height={20} borderRadius={10} />
      </View>

      <View style={styles.coinsRow}>
        <Skeleton width={50} height={24} borderRadius={12} style={styles.marginRight} />
        <Skeleton width={50} height={24} borderRadius={12} style={styles.marginRight} />
        <Skeleton width={50} height={24} borderRadius={12} />
      </View>

      <Skeleton width="100%" height={180} borderRadius={borderRadius.card} style={styles.image} />

      <View style={styles.content}>
        <Skeleton width="100%" height={18} style={styles.marginBottom} />
        <Skeleton width="90%" height={18} style={styles.marginBottom} />
        <Skeleton width="75%" height={18} />
      </View>

      <View style={styles.footer}>
        <Skeleton width={80} height={14} />
        <View style={styles.actions}>
          <Skeleton width={24} height={24} borderRadius={12} style={styles.marginRight} />
          <Skeleton width={24} height={24} borderRadius={12} style={styles.marginRight} />
          <Skeleton width={24} height={24} borderRadius={12} style={styles.marginRight} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  marginBottom: {
    marginBottom: 6,
  },
  marginRight: {
    marginRight: spacing.xs,
  },
  coinsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  image: {
    marginBottom: spacing.sm,
  },
  content: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

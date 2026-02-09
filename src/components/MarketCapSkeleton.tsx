import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { borderRadius, shadows, spacing } from '../theme/theme';

export const MarketCapSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Skeleton width={100} height={22} style={styles.title} />
      <View style={styles.placeholder}>
        <Skeleton width="80%" height={20} style={styles.marginBottom} />
        <Skeleton width="60%" height={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  placeholder: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginHorizontal: 0,
    ...shadows.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  marginBottom: {
    marginBottom: spacing.sm,
  },
});

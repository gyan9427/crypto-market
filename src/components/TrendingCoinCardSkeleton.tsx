import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export const TrendingCoinCardSkeleton: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildTrendingCoinCardSkeletonStyles(tokens), [tokens]);
  const sem = tokens.semantic;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Skeleton width={40} height={24} borderRadius={sem.cardRadiusSmall} style={styles.badge} />
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

function buildTrendingCoinCardSkeletonStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  const sem = tokens.semantic;
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: sem.listMarginH,
      marginBottom: sem.listGap,
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadiusSmall,
      padding: sem.cardPadding,
      ...sem.cardShadow,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: s.sm,
    },
    badge: {
      marginRight: s.sm,
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
}

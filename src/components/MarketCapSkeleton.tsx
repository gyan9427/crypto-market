import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export const MarketCapSkeleton: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildMarketCapSkeletonStyles(tokens), [tokens]);

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

function buildMarketCapSkeletonStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    container: {
      marginBottom: s.md,
    },
    title: {
      marginLeft: s.md,
      marginBottom: s.sm,
    },
    placeholder: {
      height: 200,
      backgroundColor: tokens.surface,
      borderRadius: br.card,
      marginHorizontal: 0,
      ...tokens.shadows.md,
      justifyContent: 'center',
      alignItems: 'center',
      padding: s.md,
    },
    marginBottom: {
      marginBottom: s.sm,
    },
  });
}

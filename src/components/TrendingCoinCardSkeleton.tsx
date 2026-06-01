import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export const TrendingCoinCardSkeleton: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);

  return (
    <View style={styles.row}>
      <Skeleton width={18} height={12} borderRadius={4} style={styles.rank} />
      <Skeleton width={34} height={34} borderRadius={17} style={styles.icon} />
      <View style={styles.identity}>
        <Skeleton width={64} height={13} borderRadius={4} style={styles.mb2} />
        <Skeleton width={36} height={10} borderRadius={4} />
      </View>
      <Skeleton width={60} height={28} borderRadius={4} style={styles.sparkline} />
      <View style={styles.priceBlock}>
        <Skeleton width={56} height={13} borderRadius={4} style={styles.mb2} />
        <Skeleton width={40} height={10} borderRadius={4} />
      </View>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const s = tokens.spacing;
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
      backgroundColor: tokens.bg,
    },
    rank: {
      marginRight: s.xs,
    },
    icon: {
      marginRight: s.sm,
    },
    identity: {
      flex: 1,
      marginRight: s.sm,
    },
    sparkline: {
      marginRight: s.md,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    mb2: {
      marginBottom: 4,
    },
  });
}

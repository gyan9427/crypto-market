import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

/** Mirrors NewsCard layout: hero, coin tag pills, title, meta, footer, actions. */
export const NewsCardSkeleton: React.FC = () => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildNewsCardSkeletonStyles(tokens), [tokens]);
  const br = tokens.borderRadius;

  return (
    <View style={styles.container}>
      <View style={styles.heroOuter}>
        <View style={styles.heroWrap}>
          <Skeleton width="100%" height={200} borderRadius={0} />
        </View>
        <View style={styles.heroFollowSkel} pointerEvents="none">
          <Skeleton width={88} height={30} borderRadius={br.button} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.coinTagsRow}>
          <Skeleton width={44} height={22} borderRadius={11} style={styles.marginRight} />
          <Skeleton width={40} height={22} borderRadius={11} style={styles.marginRight} />
          <Skeleton width={48} height={22} borderRadius={11} />
        </View>
        <Skeleton width="100%" height={20} style={styles.marginBottom} />
        <Skeleton width="92%" height={20} style={styles.marginBottom} />
        <Skeleton width={140} height={12} style={styles.sourceMetaSkel} />
      </View>

      <View style={styles.footerRow}>
        <Skeleton width="100%" height={40} borderRadius={br.md} style={styles.footerCta} />
        <Skeleton width={56} height={28} borderRadius={8} />
      </View>

      <View style={styles.actionsRow}>
        <Skeleton width={80} height={28} borderRadius={14} style={styles.marginRight} />
        <Skeleton width={28} height={28} borderRadius={14} style={styles.marginRight} />
        <Skeleton width={28} height={28} borderRadius={14} style={styles.marginRight} />
        <View style={styles.spacer} />
        <Skeleton width={28} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

function buildNewsCardSkeletonStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  return StyleSheet.create({
    container: {
      backgroundColor: sem.surface,
      borderRadius: sem.cardRadius,
      marginHorizontal: s.md,
      marginBottom: s.md,
      ...sem.cardShadow,
      overflow: 'hidden',
    },
    marginBottom: {
      marginBottom: 6,
    },
    marginRight: {
      marginRight: s.xs,
    },
    coinTagsRow: {
      flexDirection: 'row',
      marginBottom: s.xs,
    },
    heroOuter: {
      position: 'relative',
      width: '100%',
    },
    heroWrap: {
      width: '100%',
      height: 200,
      backgroundColor: c.neutral[200],
    },
    heroFollowSkel: {
      position: 'absolute',
      top: s.sm,
      right: s.sm,
      zIndex: 2,
    },
    content: {
      padding: s.md,
    },
    sourceMetaSkel: {
      marginTop: s.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingBottom: s.sm,
      gap: s.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.borderSubtle,
    },
    footerCta: {
      flex: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      paddingHorizontal: s.md,
      paddingBottom: s.md,
      alignItems: 'center',
    },
    spacer: {
      flex: 1,
    },
  });
}

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { borderRadius, spacing, semantic, colors } from '../theme/theme';

/** Mirrors NewsCard layout: header, optional coin chips, hero + follow overlay, title, source meta, footer, actions. */
export const NewsCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.headerText}>
            <Skeleton width={120} height={14} style={styles.marginBottom} />
            <Skeleton width={64} height={12} />
          </View>
        </View>
      </View>

      <View style={styles.coinsRow}>
        <Skeleton width={56} height={28} borderRadius={14} style={styles.marginRight} />
        <Skeleton width={56} height={28} borderRadius={14} style={styles.marginRight} />
        <Skeleton width={56} height={28} borderRadius={14} />
      </View>

      <View style={styles.heroOuter}>
        <View style={styles.heroWrap}>
          <Skeleton width="100%" height={200} borderRadius={0} />
        </View>
        <View style={styles.heroFollowSkel} pointerEvents="none">
          <Skeleton width={88} height={30} borderRadius={borderRadius.button} />
        </View>
      </View>

      <View style={styles.content}>
        <Skeleton width="100%" height={20} style={styles.marginBottom} />
        <Skeleton width="92%" height={20} style={styles.marginBottom} />
        <Skeleton width={140} height={12} style={styles.sourceMetaSkel} />
      </View>

      <View style={styles.footerRow}>
        <Skeleton width="100%" height={40} borderRadius={borderRadius.md} style={styles.footerCta} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadius,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...semantic.cardShadow,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: spacing.sm,
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroOuter: {
    position: 'relative',
    width: '100%',
  },
  heroWrap: {
    width: '100%',
    height: 200,
    backgroundColor: colors.neutral[200],
  },
  heroFollowSkel: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  content: {
    padding: spacing.md,
  },
  sourceMetaSkel: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
  },
  footerCta: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { Skeleton } from './Skeleton';
import { colors, spacing, typography, semantic } from '../theme/theme';

/** Map MATIC to POL for display (Polygon rebrand) */
function mapAssetDisplay(text: string | undefined | null): string {
  if (text == null || typeof text !== 'string') return '';
  return text.replace(/\bMATIC\b/gi, 'POL');
}

function formatUsd(value: number | undefined | null): string {
  if (value == null || typeof value !== 'number' || !Number.isFinite(value)) return '$0.00';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(n: number | undefined | null): string {
  if (n == null || typeof n !== 'number' || !Number.isFinite(n)) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n >= 1 ? n.toFixed(2) : n.toFixed(6);
}

export const HoldingsSegment: React.FC = () => {
  const { wallets, holdings, holdingsLoading } = usePortfolioStore();

  console.log('[Holdings] HoldingsSegment render', { walletsCount: wallets.length, holdingsLoading, hasHoldings: !!holdings, totalValue: holdings?.totalValue });

  if (wallets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Add a wallet to see holdings</Text>
        </View>
      </View>
    );
  }

  if (holdingsLoading && !holdings) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        <View style={styles.summaryCard}>
          <Skeleton width="60%" height={24} style={styles.skeletonTitle} />
          <Skeleton width="40%" height={16} style={styles.skeletonSub} />
        </View>
        <View style={styles.positionsContainer}>
          <Skeleton width="100%" height={18} />
          <Skeleton width="80%" height={18} style={{ marginTop: 8 }} />
          <Skeleton width="90%" height={18} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  if (!holdings) {
    console.log('[Holdings] HoldingsSegment: no holdings data, returning null');
    return null;
  }

  const { totalValue, absoluteChange24h, relativeChange24h, positions } = holdings;
  const changePositive = relativeChange24h >= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Holdings</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.totalValue}>{formatUsd(totalValue)}</Text>
        <Text
          style={[
            styles.change24h,
            changePositive ? styles.changePositive : styles.changeNegative,
          ]}
        >
          {changePositive ? '+' : ''}
          {relativeChange24h.toFixed(2)}% (24h)
        </Text>
      </View>
      {positions.length > 0 && (
        <View style={styles.positionsContainer}>
          {positions.slice(0, 10).map((p, i) => (
            <View
              key={`${p.symbol ?? 'sym'}-${p.chain ?? 'ch'}-${i}`}
              style={[
                styles.positionRow,
                i < Math.min(positions.length, 10) - 1 && styles.positionRowBorder,
              ]}
            >
              <View style={styles.positionLeft}>
                <View style={styles.chainBadge}>
                  <Text style={styles.chainBadgeText}>
                    {mapAssetDisplay(p.chain ?? '').toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.positionSymbol}>
                    {mapAssetDisplay(p.symbol)}
                  </Text>
                  <Text style={styles.positionQuantity}>
                    {formatQuantity(p.quantity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.positionValue}>{formatUsd(p.value)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: semantic.listMarginH,
    marginBottom:     semantic.listGap,
  },
  sectionTitle: {
    fontSize:     typography.fontSizes.md,
    fontWeight:   typography.fontWeights.semibold,
    color:        colors.neutral[800],
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadiusSmall,
    padding:          semantic.cardPadding,
    ...semantic.cardShadow,
  },
  emptyText: {
    fontSize: typography.fontSizes.sm,
    color:    colors.neutral[500],
  },
  summaryCard: {
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadiusSmall,
    padding:          semantic.cardPadding,
    marginBottom:     spacing.sm,
    ...semantic.cardShadow,
  },
  totalValue: {
    fontSize:   typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color:      colors.neutral[900],
  },
  change24h: {
    fontSize:   typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginTop:  spacing.xs,
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.error[500],
  },
  skeletonTitle: {
    marginBottom: spacing.xs,
  },
  skeletonSub: {},
  positionsContainer: {
    backgroundColor:  semantic.surface,
    borderRadius:     semantic.cardRadiusSmall,
    padding:          semantic.cardPadding,
    ...semantic.cardShadow,
  },
  positionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:    'center',
    paddingVertical: spacing.sm,
  },
  positionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  chainBadge: {
    backgroundColor:   colors.primary[100],
    borderRadius:      semantic.cardRadiusSmall,
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    marginRight:       spacing.sm,
  },
  chainBadgeText: {
    fontSize:   typography.fontSizes.badge,
    fontWeight: typography.fontWeights.bold,
    color:      colors.primary[700],
  },
  positionSymbol: {
    fontSize:   typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.neutral[800],
  },
  positionQuantity: {
    fontSize: typography.fontSizes.sm,
    color:    colors.neutral[500],
    marginTop: 2,
  },
  positionValue: {
    fontSize:   typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.neutral[800],
  },
});

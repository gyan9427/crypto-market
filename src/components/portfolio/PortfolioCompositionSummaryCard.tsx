import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';
import { MARKET_ACCENT, usePiStyles } from '@/src/components/portfolio-intelligence/piStyles';
import { PortfolioPieChart } from '@/src/components/portfolio/PortfolioPieChart';
import {
  buildPortfolioComposition,
  formatCompositionPct,
  formatCompositionUsd,
} from '@/src/utils/portfolioComposition';
import type { Holdings, WalletAddress, ExchangeConnection } from '@/src/types';
import type { PortfolioAccountSelection } from '@/src/utils/portfolioAccountFilter';

interface PortfolioCompositionSummaryCardProps {
  holdings: Holdings | null;
  selectedAccount: PortfolioAccountSelection;
  wallets: WalletAddress[];
  exchanges: ExchangeConnection[];
  loading?: boolean;
  onPressViewComposition: () => void;
  embedded?: boolean;
}

export const PortfolioCompositionSummaryCard: React.FC<PortfolioCompositionSummaryCardProps> = ({
  holdings,
  selectedAccount,
  wallets,
  exchanges,
  loading,
  onPressViewComposition,
  embedded,
}) => {
  const { t } = useTranslation();
  const styles = usePiStyles();

  const composition = useMemo(
    () => buildPortfolioComposition(holdings, selectedAccount, t, wallets, exchanges),
    [holdings, selectedAccount, t, wallets, exchanges]
  );

  if (loading && !composition) {
    return (
      <View style={embedded ? styles.carouselCardShell : styles.sectionWrap}>
        <View style={[styles.card, embedded && styles.carouselCard]}>
          <Text style={styles.eyebrow}>{t('portfolio.compositionTitle')}</Text>
          <Text style={styles.metricLabel}>{t('portfolio.compositionLoading')}</Text>
        </View>
      </View>
    );
  }

  if (!composition) return null;

  const topSlice = composition.slices[0];
  const legendSlots = Array.from({ length: 4 }, (_, i) => composition.slices[i] ?? null);

  return (
    <View style={embedded ? styles.carouselCardShell : styles.sectionWrap}>
      <TouchableOpacity
        style={[styles.card, embedded && styles.carouselCard]}
        onPress={onPressViewComposition}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('portfolio.viewComposition')}
      >
        <Text style={styles.eyebrow}>{t('portfolio.compositionTitle')}</Text>
        <View style={styles.carouselBody}>
          <PortfolioPieChart slices={composition.slices} size={108} />
          <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
            {legendSlots.map((slice, index) => (
              <View key={slice?.key ?? `slot-${index}`} style={styles.carouselLegendSlot}>
                {slice ? (
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: slice.color,
                          marginRight: 8,
                        }}
                      />
                      <Text style={styles.barLabel} numberOfLines={1}>
                        {slice.symbol}
                      </Text>
                    </View>
                    <Text style={styles.barPct}>{formatCompositionPct(slice.pct)}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.carouselHint}>
          {topSlice ? (
            <Text style={styles.insightSummary} numberOfLines={2}>
              {t('portfolio.compositionTopHint', {
                symbol: topSlice.symbol,
                pct: formatCompositionPct(topSlice.pct),
                total: formatCompositionUsd(composition.totalUsd),
              })}
            </Text>
          ) : null}
        </View>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>{t('portfolio.viewComposition')}</Text>
          <ChevronRight size={16} color={MARKET_ACCENT} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

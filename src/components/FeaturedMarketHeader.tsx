import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PriceAreaChart } from '../charts/components/PriceAreaChart';
import { useKlines } from '../charts/hooks/useKlines';
import { DEFAULT_MARKET_SYMBOL, VALID_INTERVALS } from '../charts/constants';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { colors, spacing } from '../theme/theme';

const COIN_OPTIONS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' },
];

export const FeaturedMarketHeader: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_MARKET_SYMBOL);
  const [selectedInterval, setSelectedInterval] = useState<typeof VALID_INTERVALS[number]>('1h');
  const { chartData, loading } = useKlines(selectedSymbol, selectedInterval, { enabled: true });
  const { prices } = useMarketPrices([selectedSymbol]);

  const selectedCoin = useMemo(
    () => COIN_OPTIONS.find((c) => c.symbol === selectedSymbol),
    [selectedSymbol]
  );
  const live = prices.get(selectedSymbol);
  const latestChartValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null;

  const priceText = live?.price != null
    ? `$${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : latestChartValue != null
      ? `$${latestChartValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : '--';
  const changeText = live?.percentChange24h != null
    ? `${live.percentChange24h >= 0 ? '+' : ''}${live.percentChange24h.toFixed(2)}%`
    : '--';
  const isPositive = (live?.percentChange24h ?? 0) >= 0;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coinRow}>
        {COIN_OPTIONS.map((coin) => (
          <TouchableOpacity
            key={coin.symbol}
            style={[styles.coinBtn, selectedSymbol === coin.symbol && styles.coinBtnActive]}
            onPress={() => setSelectedSymbol(coin.symbol)}
            activeOpacity={0.85}
          >
            <Text style={[styles.coinText, selectedSymbol === coin.symbol && styles.coinTextActive]}>
              {coin.symbol}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.chartCard}>
        <View style={styles.headerRow}>
          <View style={styles.symbolCol}>
            <Text style={styles.title}>{selectedSymbol}</Text>
            <Text style={styles.subtitle}>{selectedCoin?.name ?? selectedSymbol}</Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.price} numberOfLines={1} adjustsFontSizeToFit>
              {priceText}
            </Text>
            <Text
              style={[styles.change, { color: isPositive ? colors.success[500] : colors.danger[500] }]}
              numberOfLines={1}
            >
              {changeText}
            </Text>
          </View>
        </View>

        <View style={styles.chartViewport}>
          {loading ? null : (
            <PriceAreaChart
              data={chartData}
              height={128}
              color={colors.primary[500]}
              showDataPoints={false}
              flush
            />
          )}
        </View>

        <View style={styles.rangeRow}>
          {VALID_INTERVALS.map((interval) => (
            <TouchableOpacity
              key={interval}
              style={[styles.rangeBtn, selectedInterval === interval && styles.rangeBtnActive]}
              onPress={() => setSelectedInterval(interval)}
              activeOpacity={0.8}
            >
              <Text style={[styles.rangeText, selectedInterval === interval && styles.rangeTextActive]}>
                {interval.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* <View style={styles.promoCard}>
        <Text style={styles.promoText}>Let an AI model trade for you</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Owned</Text>
          <Text style={styles.summaryValue}>5</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={styles.summaryValue}>$1,580.3</Text>
        </View>
        <View style={styles.summaryColRight}>
          <Text style={styles.summaryLabel}>Profits Changes</Text>
          <Text style={styles.summaryProfit}>+$150</Text>
        </View>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: spacing.sm,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  symbolCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.neutral[900],
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.neutral[500],
    marginTop: 2,
    fontSize: 12,
  },
  priceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '58%',
  },
  price: {
    color: colors.neutral[900],
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'right',
  },
  change: {
    color: colors.success[500],
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'right',
  },
  chartWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  chartCard: {
    width: '100%',
    marginTop: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  chartViewport: {
    width: '100%',
    marginTop: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coinRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  coinBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
  },
  coinBtnActive: {
    backgroundColor: colors.primary[500],
  },
  coinText: {
    color: colors.neutral[700],
    fontWeight: '700',
    fontSize: 12,
  },
  coinTextActive: {
    color: '#fff',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  rangeBtnActive: {
    backgroundColor: colors.primary[500],
  },
  rangeText: {
    color: colors.neutral[700],
    fontWeight: '700',
    fontSize: 12,
  },
  rangeTextActive: {
    color: '#fff',
  },
  promoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  promoText: {
    color: colors.neutral[300],
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
  },
  summaryColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryLabel: {
    color: colors.neutral[400],
    fontSize: 12,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryProfit: {
    color: '#38d49f',
    fontSize: 16,
    fontWeight: '800',
  },
});

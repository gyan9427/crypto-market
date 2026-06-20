import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { ExchangeConnection, Holdings, WalletAddress } from '@/src/types';
import type { PortfolioEvolutionPoint } from '@/src/services/portfolioIntelligenceApi';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import {
  getAccountSelectionLabel,
  type PortfolioAccountSelection,
} from '@/src/utils/portfolioAccountFilter';
import {
  buildPortfolioGrowthSeries,
  formatGrowthAxisTime,
  formatGrowthAxisValue,
  type GrowthPeriod,
} from '@/src/utils/portfolioGrowthSeries';

const MARKET_ACCENT = '#6383ff';
const CHART_HEIGHT = 168;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 8;
const PAD_BOTTOM = 28;

type PeriodOption = { period: GrowthPeriod; labelKey: string };

const PERIODS: PeriodOption[] = [
  { period: '24h', labelKey: 'portfolio.growthPeriod24h' },
  { period: '1W', labelKey: 'portfolio.growthPeriod1W' },
  { period: '1M', labelKey: 'portfolio.growthPeriod1M' },
  { period: '1Y', labelKey: 'portfolio.growthPeriod1Y' },
  { period: 'all', labelKey: 'portfolio.growthPeriodAll' },
];

interface PortfolioGrowthChartProps {
  selectedAccount: PortfolioAccountSelection;
  holdings: Holdings | null;
  evolution: PortfolioEvolutionPoint[];
  wallets: WalletAddress[];
  exchanges: ExchangeConnection[];
  loading?: boolean;
  onPeriodChange?: (period: GrowthPeriod) => void;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  selectedAccount,
  holdings,
  evolution,
  wallets,
  exchanges,
  loading,
  onPeriodChange,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const [period, setPeriod] = useState<GrowthPeriod>('1M');
  const [chartWidth, setChartWidth] = useState(0);

  const scopeLabel = getAccountSelectionLabel(selectedAccount, t, wallets, exchanges);

  const series = useMemo(
    () =>
      buildPortfolioGrowthSeries({
        evolution,
        holdings,
        selection: selectedAccount,
        period,
      }),
    [evolution, holdings, selectedAccount, period]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePeriod = useCallback(
    (next: GrowthPeriod) => {
      setPeriod(next);
      onPeriodChange?.(next);
    },
    [onPeriodChange]
  );

  const chartGeom = useMemo(() => {
    if (!series || chartWidth <= 0) return null;

    const innerW = chartWidth - PAD_LEFT - PAD_RIGHT;
    const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const values = series.points.map((p) => p.valueUsd);
    const minTime = series.windowStartMs;
    const maxTime = series.windowEndMs;
    const timeRange = maxTime - minTime || 1;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const valRange = maxVal - minVal || 1;

    const coords = series.points.map((p) => {
      const tMs = Math.min(Math.max(new Date(p.asOf).getTime(), minTime), maxTime);
      const x = PAD_LEFT + ((tMs - minTime) / timeRange) * innerW;
      const y = PAD_TOP + (1 - (p.valueUsd - minVal) / valRange) * innerH;
      return { x, y, ...p };
    });

    const linePath = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(' ');

    const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} Z`;

    const yTicks = [0, 0.5, 1].map((frac) => {
      const val = minVal + valRange * (1 - frac);
      return {
        y: PAD_TOP + frac * innerH,
        label: formatGrowthAxisValue(val),
        key: `y-${frac}-${val.toFixed(2)}`,
      };
    });

    const xTicks = [0, 0.5, 1].map((frac) => {
      const tMs = minTime + timeRange * frac;
      return {
        x: PAD_LEFT + frac * innerW,
        label: formatGrowthAxisTime(new Date(tMs).toISOString(), period),
        key: `x-${period}-${frac}-${Math.round(tMs)}`,
      };
    });

    const last = coords[coords.length - 1];
    const positive = series.periodChangePct >= 0;

    return {
      linePath,
      areaPath,
      yTicks,
      xTicks,
      last,
      innerW,
      innerH,
      positive,
      baselineY: PAD_TOP + innerH,
    };
  }, [series, chartWidth, period]);

  if (!holdings) return null;

  const changePositive = (series?.periodChangePct ?? 0) >= 0;
  const changeColor = changePositive ? tokens.colors.success[500] : tokens.colors.danger[500];

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{t('portfolio.growthTitle')}</Text>
            <Text style={styles.scopeLabel} numberOfLines={1}>
              {scopeLabel}
            </Text>
          </View>
          {series ? (
            <View style={styles.headerMetrics}>
              <Text style={styles.currentValue}>{formatUsd(series.currentValue)}</Text>
              <Text style={[styles.changeText, { color: changeColor }]}>
                {changePositive ? '▲' : '▼'} {Math.abs(series.periodChangePct).toFixed(2)}%
              </Text>
            </View>
          ) : null}
        </View>

        {series?.approximated ? (
          <Text style={styles.approxHint}>{t('portfolio.growthApproximated')}</Text>
        ) : null}

        <View style={styles.chartShell} onLayout={handleLayout}>
          {loading && !series ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={MARKET_ACCENT} />
            </View>
          ) : chartGeom && series ? (
            <>
              <Svg width={chartWidth} height={CHART_HEIGHT}>
                <Defs>
                  <LinearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={MARKET_ACCENT} stopOpacity="0.28" />
                    <Stop offset="100%" stopColor={MARKET_ACCENT} stopOpacity="0" />
                  </LinearGradient>
                </Defs>

                <Line
                  x1={PAD_LEFT}
                  y1={chartGeom.baselineY}
                  x2={PAD_LEFT + chartGeom.innerW}
                  y2={chartGeom.baselineY}
                  stroke={tokens.isDark ? 'rgba(255,255,255,0.08)' : tokens.borderSubtle}
                  strokeWidth={1}
                />

                {chartGeom.yTicks.map((tick) => (
                  <Line
                    key={tick.key}
                    x1={PAD_LEFT}
                    y1={tick.y}
                    x2={PAD_LEFT + chartGeom.innerW}
                    y2={tick.y}
                    stroke={tokens.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                    strokeWidth={1}
                  />
                ))}

                <Path d={chartGeom.areaPath} fill="url(#growthFill)" />
                <Path
                  d={chartGeom.linePath}
                  fill="none"
                  stroke={chartGeom.positive ? tokens.colors.success[500] : tokens.colors.danger[500]}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx={chartGeom.last.x}
                  cy={chartGeom.last.y}
                  r={4}
                  fill={chartGeom.positive ? tokens.colors.success[500] : tokens.colors.danger[500]}
                />
              </Svg>

              <View style={styles.yAxisLabels} pointerEvents="none">
                {chartGeom.yTicks.map((tick) => (
                  <Text
                    key={tick.key}
                    style={[styles.axisLabelY, { top: tick.y - 8 }]}
                  >
                    {tick.label}
                  </Text>
                ))}
              </View>

              <View style={styles.xAxisLabels} pointerEvents="none">
                {chartGeom.xTicks.map((tick) => (
                  <Text
                    key={tick.key}
                    style={[styles.axisLabelX, { left: tick.x - 24 }]}
                  >
                    {tick.label}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.loadingWrap}>
              <Text style={styles.emptyText}>{t('portfolio.growthEmpty')}</Text>
            </View>
          )}
        </View>

        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const active = period === p.period;
            return (
              <TouchableOpacity
                key={p.period}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => handlePeriod(p.period)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {t(p.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const cardBg = tokens.isDark ? '#0f0f14' : tokens.surface;

  return StyleSheet.create({
    sectionWrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: tokens.semantic?.cardRadius ?? 12,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.08)' : tokens.borderSubtle,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 8,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    headerMetrics: {
      alignItems: 'flex-end',
    },
    eyebrow: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    scopeLabel: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      marginTop: 4,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    currentValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
    },
    changeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },
    approxHint: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    chartShell: {
      minHeight: CHART_HEIGHT,
      position: 'relative',
    },
    loadingWrap: {
      minHeight: CHART_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    yAxisLabels: {
      ...StyleSheet.absoluteFill,
    },
    xAxisLabels: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: PAD_BOTTOM,
    },
    axisLabelY: {
      position: 'absolute',
      left: 0,
      width: PAD_LEFT - 4,
      fontSize: 10,
      color: tokens.textMuted,
      textAlign: 'right',
    },
    axisLabelX: {
      position: 'absolute',
      bottom: 2,
      width: 48,
      fontSize: 10,
      color: tokens.textMuted,
      textAlign: 'center',
    },
    periodRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    periodChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 2,
      borderRadius: 8,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    },
    periodChipActive: {
      backgroundColor: tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)',
    },
    periodChipText: {
      fontSize: 11,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
    },
    periodChipTextActive: {
      color: MARKET_ACCENT,
    },
  });
}

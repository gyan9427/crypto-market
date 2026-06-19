import { StyleSheet } from 'react-native';
import type { ThemeTokens } from '@/src/design-system/theme/types';
import { getMarketCapChartColors } from './marketCapChartColors';

export const MARKET_CAP_Y_AXIS_W = 52;

export function buildMarketCapStyles(
  tokens: ThemeTokens,
  chartColors: ReturnType<typeof getMarketCapChartColors>
) {
  const { line: LINE_COLOR, green: GREEN, red: RED } = chartColors;
  const { spacing: s, borderRadius: br, typography: typo } = tokens;
  const accentTabBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const chartSkeletonFill = tokens.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const skeletonFill = tokens.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
    container: { marginBottom: 0 },
    card: {
      backgroundColor: tokens.bg,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingTop: s.lg,
      paddingHorizontal: s.lg,
      paddingBottom: s.md,
      overflow: 'hidden',
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: s.sm,
    },
    title: {
      fontSize: typo.fontSizes.xxxl,
      fontWeight: typo.fontWeights.light,
      fontFamily: typo.fontFamilies.sans,
      color: tokens.textStrong,
      letterSpacing: typo.letterSpacing.section,
      fontVariant: ['tabular-nums'],
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      marginTop: s.xs,
    },
    changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    changeBadgeUp: { backgroundColor: 'rgba(39,196,133,0.13)' },
    changeBadgeDn: { backgroundColor: 'rgba(240,82,82,0.13)'  },
    changeBadgeText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    statsText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    changeUp: { color: GREEN },
    changeDn: { color: RED   },
    periodLabel: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.eyebrow,
      alignSelf: 'flex-start',
      marginTop: 4,
    },

    // Range tabs
    rangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: s.sm },
    rangeTabsScroll: { flex: 1, marginHorizontal: -s.lg },
    rangeTabs: { flexDirection: 'row', gap: 4, paddingHorizontal: s.lg },
    rangeTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    rangeTabActive: { backgroundColor: accentTabBg },
    rangeTabText: {
      fontSize: 12,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: tokens.textMuted,
    },
    rangeTabTextActive: { color: LINE_COLOR },
    viewToggleGroup: { flexDirection: 'row', gap: 2, paddingLeft: 6 },
    viewToggleBtn: { padding: 5, borderRadius: 6 },
    viewToggleBtnActive: { backgroundColor: accentTabBg },

    // Chart
    chartRow: { flexDirection: 'row', marginTop: s.xs, alignItems: 'flex-start' },
    yAxisColumn: {
      width: MARKET_CAP_Y_AXIS_W,
      position: 'relative',
      flexShrink: 0,
    },
    yAxisLabel: {
      position: 'absolute',
      right: 6,
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      fontFamily: typo.fontFamilies.sansMedium,
      fontVariant: ['tabular-nums'],
    },
    chartWrapper:  { flex: 1, position: 'relative' },
    chartSkeleton: {
      width: '100%',
      borderRadius: br.md,
      backgroundColor: chartSkeletonFill,
    },
    hoverLabel: {
      position: 'absolute',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: br.sm,
      backgroundColor: tokens.isDark ? 'rgba(22,22,28,0.92)' : 'rgba(250,250,252,0.96)',
      borderWidth: 0.5,
      borderColor: tokens.isDark ? 'rgba(99,131,255,0.28)' : 'rgba(99,131,255,0.35)',
      alignItems: 'center',
    },
    hoverLabelTime: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      fontFamily: typo.fontFamilies.sans,
    },
    hoverLabelPrice: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.textStrong,
      fontVariant: ['tabular-nums'],
      marginTop: 1,
    },
    interactionLayer: { position: 'absolute', left: 0, top: 0 },
    returnToLiveBtn: {
      position: 'absolute',
      right: 4,
      top: 4,
      zIndex: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: br.sm,
      backgroundColor: tokens.isDark ? 'rgba(22,22,28,0.92)' : 'rgba(250,250,252,0.96)',
      borderWidth: 0.5,
      borderColor: tokens.isDark ? 'rgba(99,131,255,0.35)' : 'rgba(99,131,255,0.45)',
    },
    returnToLiveText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: LINE_COLOR,
      letterSpacing: typo.letterSpacing.caption,
    },
    xAxisLabels: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: s.sm,
    },
    xLabel: {
      fontSize: typo.fontSizes.badge,
      fontFamily: typo.fontFamilies.sans,
      color: tokens.textMuted,
      letterSpacing: typo.letterSpacing.caption,
    },
    noDataText: {
      color: tokens.textMuted,
      fontSize: typo.fontSizes.xs,
      fontFamily: typo.fontFamilies.sans,
      textAlign: 'center',
      marginTop: 50,
    },

    // Stats grid
    statsGrid: {
      marginTop: s.md,
      borderRadius: br.md,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: tokens.borderSubtle,
    },
    statsGridRow: {
      flexDirection: 'row',
    },
    statDividerV: {
      width: 0.5,
      backgroundColor: tokens.borderSubtle,
    },
    statDividerH: {
      height: 0.5,
      backgroundColor: tokens.borderSubtle,
    },
    statCell: {
      flex: 1,
      backgroundColor: tokens.surfaceMuted,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    statLabel: {
      fontSize: 10,
      color: tokens.textMuted,
      fontFamily: typo.fontFamilies.sans,
      marginBottom: 3,
    },
    statValue: {
      fontSize: 14,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: tokens.text,
      fontVariant: ['tabular-nums'],
    },

    // OHLC tooltip
    ohlcRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
    ohlcItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ohlcLabel: {
      fontSize: 9,
      color: tokens.textMuted,
      fontFamily: typo.fontFamilies.sans,
    },
    ohlcValue: {
      fontSize: 10,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: tokens.textStrong,
      fontVariant: ['tabular-nums'],
    },

    // Skeleton
    skeletonBlock: { backgroundColor: skeletonFill, borderRadius: br.sm },
    titleSkeleton: { width: 140, height: 34, marginBottom: 6 },
    statSkeleton:  { width: 64,  height: 14 },
  });
}

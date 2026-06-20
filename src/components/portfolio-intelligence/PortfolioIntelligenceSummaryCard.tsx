import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { healthScoreColor, MARKET_ACCENT, usePiStyles } from './piStyles';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { PortfolioSummaryDto, PiInsight } from '@/src/services/portfolioIntelligenceApi';

interface PortfolioIntelligenceSummaryCardProps {
  summary: PortfolioSummaryDto | null;
  topInsight: PiInsight | null;
  loading?: boolean;
  onPressViewIntelligence: () => void;
  embedded?: boolean;
}

export const PortfolioIntelligenceSummaryCard: React.FC<PortfolioIntelligenceSummaryCardProps> = ({
  summary,
  topInsight,
  loading,
  onPressViewIntelligence,
  embedded,
}) => {
  const styles = usePiStyles();
  const { tokens } = useAppTheme();

  if (loading && !summary) {
    return (
      <View style={embedded ? styles.carouselCardShell : undefined}>
        <View style={[styles.skeletonCard, embedded && styles.carouselCard, embedded && { marginHorizontal: 0 }]}>
          <View style={styles.carouselBody}>
            <View style={[styles.ringOuter, { borderColor: tokens.textMuted, opacity: 0.3 }]} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.metricLabel}>Loading…</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!summary) return null;

  const ringColor = healthScoreColor(summary.healthScore, tokens);

  return (
    <View style={embedded ? styles.carouselCardShell : styles.sectionWrap}>
      <TouchableOpacity
        style={[styles.card, embedded && styles.carouselCard]}
        onPress={onPressViewIntelligence}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="View portfolio intelligence"
      >
        <Text style={styles.eyebrow}>Portfolio Intelligence</Text>
        <View style={styles.carouselBody}>
          <View style={{ width: 108, alignItems: 'center', justifyContent: 'center' }}>
            <View style={[styles.ringOuter, { borderColor: ringColor }]}>
              <Text style={styles.ringScore}>
                {summary.healthScore != null ? Math.round(summary.healthScore) : '—'}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
            <Text style={styles.metricLabel}>{summary.healthLabel}</Text>
            <View style={[styles.badge, { marginTop: 8 }]}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {summary.identity.name}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.carouselHint}>
          {topInsight ? (
            <Text style={styles.insightSummary} numberOfLines={2}>
              {topInsight.title}
            </Text>
          ) : (
            <Text style={styles.insightSummary} numberOfLines={2}>
              Top category: {summary.topCategory.name} ({summary.topCategory.pct.toFixed(0)}%)
            </Text>
          )}
        </View>
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>View Intelligence</Text>
          <ChevronRight size={16} color={MARKET_ACCENT} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

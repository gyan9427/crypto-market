import React from 'react';
import { View, Text } from 'react-native';
import { severityColor, usePiStyles } from './piStyles';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { PiInsight } from '@/src/services/portfolioIntelligenceApi';

interface InsightCardProps {
  insight: PiInsight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const styles = usePiStyles();
  const { tokens } = useAppTheme();
  const accent = severityColor(insight.severity, tokens);

  return (
    <View
      style={[
        styles.card,
        {
          marginBottom: 10,
          borderLeftWidth: 3,
          borderLeftColor: accent,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, { marginBottom: 0, flex: 1 }]} numberOfLines={2}>
          {insight.title}
        </Text>
        <Text style={[styles.barPct, { marginLeft: 8, color: accent, textTransform: 'capitalize' }]}>
          {insight.severity}
        </Text>
      </View>
      <Text style={styles.insightSummary}>{insight.summary}</Text>
    </View>
  );
};

interface PortfolioInsightsListProps {
  insights: PiInsight[];
}

export const PortfolioInsightsList: React.FC<PortfolioInsightsListProps> = ({ insights }) => {
  const styles = usePiStyles();

  const sorted = [...insights]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8);

  if (sorted.length === 0) {
    return (
      <View style={[styles.sectionWrap, styles.card]}>
        <Text style={styles.cardTitle}>Insights</Text>
        <Text style={styles.cardSubtitle}>No insights yet. Check back after your portfolio syncs.</Text>
      </View>
    );
  }

  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.cardTitle, { paddingHorizontal: 0 }]}>Insights</Text>
      {sorted.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </View>
  );
};

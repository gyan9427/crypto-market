import React from 'react';
import { View, Text } from 'react-native';
import { usePiStyles } from './piStyles';
import type { PortfolioAnalyticsPayload, PortfolioSummaryDto } from '@/src/services/portfolioIntelligenceApi';

interface InvestorIdentityCardProps {
  summary: PortfolioSummaryDto | null;
  analytics: PortfolioAnalyticsPayload | null;
}

export const InvestorIdentityCard: React.FC<InvestorIdentityCardProps> = ({ summary, analytics }) => {
  const styles = usePiStyles();

  const primary = summary?.identity ?? analytics?.identity?.primary;
  const secondary = analytics?.identity?.secondary;
  const signals = analytics?.identity?.signals ?? {};

  if (!primary) return null;

  const topSignals = Object.entries(signals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>Investor Identity</Text>
      <View style={[styles.badge, { marginBottom: 8 }]}>
        <Text style={styles.badgeText}>{primary.name}</Text>
      </View>
      <Text style={styles.cardSubtitle}>
        Confidence {Math.round(primary.confidence * 100)}%
        {secondary ? ` · Secondary: ${secondary.name}` : ''}
      </Text>
      {topSignals.length > 0 ? (
        <View style={{ marginTop: 8, gap: 6 }}>
          {topSignals.map(([key, value]) => (
            <View key={key} style={styles.barLabelRow}>
              <Text style={styles.barLabel}>{key.replace(/_/g, ' ')}</Text>
              <Text style={styles.barPct}>{Math.round(value * 100)}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

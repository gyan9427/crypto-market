import React from 'react';
import { View, Text } from 'react-native';
import { healthScoreColor, usePiStyles } from './piStyles';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { PortfolioAnalyticsPayload, PortfolioSummaryDto } from '@/src/services/portfolioIntelligenceApi';

interface PortfolioHealthCardProps {
  summary: PortfolioSummaryDto | null;
  analytics: PortfolioAnalyticsPayload | null;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  risk: 'Risk',
  diversification: 'Diversification',
  concentration: 'Concentration',
  stablecoin: 'Stablecoin buffer',
};

export const PortfolioHealthCard: React.FC<PortfolioHealthCardProps> = ({ summary, analytics }) => {
  const styles = usePiStyles();
  const { tokens } = useAppTheme();

  const healthScore = summary?.healthScore ?? analytics?.health?.healthScore ?? null;
  const healthLabel = summary?.healthLabel ?? analytics?.health?.healthLabel ?? 'Unknown';
  const riskScore = summary?.riskScore ?? analytics?.risk?.riskScore ?? 0;
  const riskLabel = summary?.riskLabel ?? analytics?.risk?.riskLabel ?? 'Unknown';
  const breakdown = analytics?.health?.breakdown;
  const ringColor = healthScoreColor(healthScore, tokens);

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>Portfolio Health</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={[styles.ringOuter, { borderColor: ringColor, width: 72, height: 72, borderRadius: 36 }]}>
          <Text style={[styles.ringScore, { fontSize: 22 }]}>
            {healthScore != null ? Math.round(healthScore) : '—'}
          </Text>
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={styles.metricValue}>{healthLabel}</Text>
          <Text style={styles.metricLabel}>Overall health score</Text>
          <Text style={[styles.metricLabel, { marginTop: 10 }]}>
            Risk {Math.round(riskScore)} · {riskLabel}
          </Text>
        </View>
      </View>
      {breakdown ? (
        <View style={{ gap: 10 }}>
          {Object.entries(breakdown).map(([key, value]) => (
            <View key={key}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>{BREAKDOWN_LABELS[key] ?? key}</Text>
                <Text style={styles.barPct}>{Math.round(value)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, value))}%` }]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

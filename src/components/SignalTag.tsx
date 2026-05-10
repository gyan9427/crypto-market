import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Zap, AlertTriangle } from 'lucide-react-native';
import type { CoinSignal, SignalType } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export interface SignalTagProps {
  signal: CoinSignal;
}

function iconForType(type: SignalType, color: string, size: number) {
  switch (type) {
    case 'breakout':
      return <Zap size={size} color={color} accessibilityLabel="" />;
    case 'volatile':
      return <AlertTriangle size={size} color={color} accessibilityLabel="" />;
    default:
      return <TrendingUp size={size} color={color} accessibilityLabel="" />;
  }
}

export const SignalTag = React.memo(function SignalTag({ signal }: SignalTagProps) {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;
  const positive = signal.severity === 'positive';
  const fg = positive ? c.success[600] : c.danger[500];
  const bg = positive ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.12)';

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: positive ? c.success[500] : c.danger[500] }]}>
      {iconForType(signal.type, fg, 12)}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {signal.label}
      </Text>
    </View>
  );
});

function buildStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 9999,
      borderWidth: 1,
      maxWidth: 160,
    },
    label: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      flexShrink: 1,
    },
  });
}

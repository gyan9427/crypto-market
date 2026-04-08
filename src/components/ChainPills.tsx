import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SupportedChain } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface ChainPillsProps {
  chains:         SupportedChain[];
  selectedChains: string[];
  onToggle:       (chainId: string) => void;
}

export const ChainPills: React.FC<ChainPillsProps> = ({
  chains,
  selectedChains,
  onToggle,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildChainPillsStyles(tokens), [tokens]);

  if (chains.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chains.map((chain) => {
        const isSelected = selectedChains.includes(chain.id);
        return (
          <TouchableOpacity
            key={chain.id}
            style={[styles.pill, isSelected && styles.pillActive]}
            onPress={() => onToggle(chain.id)}
            accessibilityRole="checkbox"
            accessibilityLabel={chain.name}
            accessibilityState={{ checked: isSelected }}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
              {chain.symbol}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

function buildChainPillsStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      paddingHorizontal: s.md,
      paddingVertical: s.xs,
      flexDirection: 'row',
    },
    pill: {
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderRadius: br.button,
      backgroundColor: c.neutral[100],
      marginRight: s.xs,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: c.primary[500],
    },
    pillText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[600],
    },
    pillTextActive: {
      color: c.surface,
    },
  });
}

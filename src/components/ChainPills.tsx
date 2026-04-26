import React, { useMemo } from 'react';
import {
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
  disabled?:      boolean;
}

export const ChainPills: React.FC<ChainPillsProps> = ({
  chains,
  selectedChains,
  onToggle,
  disabled = false,
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
            style={[styles.pill, isSelected && styles.pillActive, disabled && styles.pillDisabled]}
            onPress={() => onToggle(chain.id)}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityLabel={chain.name}
            accessibilityState={{ checked: isSelected }}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive, disabled && styles.pillTextDisabled]}>
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
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      paddingHorizontal: 0,
      paddingVertical: s.xs,
      flexDirection: 'row',
    },
    pill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: c.neutral[800],
      backgroundColor: 'transparent',
      marginRight: s.xs,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillActive: {
      backgroundColor: c.primary[100],
      borderColor: c.primary[500],
    },
    pillDisabled: {
      opacity: 0.5,
    },
    pillText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[700],
    },
    pillTextActive: {
      color: c.primary[700],
    },
    pillTextDisabled: {
      color: c.neutral[500],
    },
  });
}

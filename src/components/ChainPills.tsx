import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SupportedChain } from '../types';
import { colors, borderRadius, spacing, typography } from '../theme/theme';

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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.xs,
    flexDirection:     'row',
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical:   spacing.xs,
    borderRadius:      borderRadius.button,
    backgroundColor:   colors.neutral[100],
    marginRight:       spacing.xs,
    minHeight:         32,
    justifyContent:    'center',
    alignItems:        'center',
  },
  pillActive: {
    backgroundColor: colors.primary[500],
  },
  pillText: {
    fontSize:   typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color:      colors.neutral[600],
  },
  pillTextActive: {
    color: colors.surface,
  },
});

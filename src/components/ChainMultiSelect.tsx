import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Check, Layers, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SupportedChain } from '../types';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface ChainMultiSelectProps {
  chains: SupportedChain[];
  selectedChains: string[];
  onChange: (chainIds: string[]) => void;
}

export const ChainMultiSelect: React.FC<ChainMultiSelectProps> = ({
  chains,
  selectedChains,
  onChange,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildChainMultiSelectStyles(tokens), [tokens]);
  const c = tokens.colors;

  const evmChainIds = useMemo(
    () => chains.filter((chain) => chain.kind !== 'solana').map((chain) => chain.id),
    [chains]
  );
  const selectedSet = useMemo(() => new Set(selectedChains), [selectedChains]);
  const selectedCount = selectedChains.length;
  const allEvmSelected = evmChainIds.length > 0 && evmChainIds.every((id) => selectedSet.has(id));

  if (chains.length === 0) return null;

  const handleToggle = (chain: SupportedChain) => {
    const isSelected = selectedSet.has(chain.id);
    if (chain.kind === 'solana') {
      onChange(isSelected ? [] : [chain.id]);
      return;
    }

    const withoutSolana = selectedChains.filter((id) => {
      return chains.find((candidate) => candidate.id === id)?.kind !== 'solana';
    });
    const next = isSelected
      ? withoutSolana.filter((id) => id !== chain.id)
      : [...withoutSolana, chain.id];
    onChange(next);
  };

  const handleSelectAllEvm = () => {
    onChange(allEvmSelected ? [] : evmChainIds);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.selectedCount}>
          {t('monitorWallet.selectedCount', { count: selectedCount })}
        </Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={handleSelectAllEvm}
            accessibilityRole="button"
            accessibilityLabel={t('monitorWallet.selectAllEvm')}
          >
            <Layers size={14} color={c.primary[600]} />
            <Text style={styles.toolbarButtonText}>
              {allEvmSelected ? t('monitorWallet.clear') : t('monitorWallet.selectAllEvm')}
            </Text>
          </TouchableOpacity>
          {selectedCount > 0 && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => onChange([])}
              accessibilityRole="button"
              accessibilityLabel={t('monitorWallet.clear')}
            >
              <X size={14} color={tokens.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        {chains.map((chain) => {
          const isSelected = selectedSet.has(chain.id);
          return (
            <TouchableOpacity
              key={chain.id}
              style={[styles.tile, isSelected && styles.tileActive]}
              onPress={() => handleToggle(chain)}
              accessibilityRole="checkbox"
              accessibilityLabel={chain.name}
              accessibilityState={{ checked: isSelected }}
              activeOpacity={0.82}
            >
              <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                {isSelected && <Check size={13} color={c.surface} strokeWidth={3} />}
              </View>
              <View style={styles.chainCopy}>
                <Text style={[styles.chainSymbol, isSelected && styles.chainSymbolActive]} numberOfLines={1}>
                  {chain.symbol}
                </Text>
                <Text style={[styles.chainName, isSelected && styles.chainNameActive]} numberOfLines={1}>
                  {chain.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

function buildChainMultiSelectStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  return StyleSheet.create({
    container: {
      marginBottom: s.sm,
    },
    toolbar: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s.xs,
    },
    selectedCount: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
    },
    toolbarActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toolbarButton: {
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: s.sm,
      borderRadius: sem.cardRadiusSmall,
      backgroundColor: c.primary[50],
      borderWidth: 1,
      borderColor: c.primary[100],
    },
    toolbarButtonText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[700],
    },
    iconButton: {
      width: 28,
      height: 28,
      borderRadius: sem.cardRadiusSmall,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: s.xs,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      backgroundColor: tokens.inputBg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: s.xs,
    },
    tile: {
      width: '48.5%',
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.sm,
      paddingVertical: s.sm,
      borderRadius: sem.cardRadiusSmall,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      backgroundColor: tokens.inputBg,
    },
    tileActive: {
      borderColor: c.primary[400],
      backgroundColor: c.primary[50],
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.neutral[300],
      marginRight: s.sm,
      backgroundColor: tokens.surface,
    },
    checkCircleActive: {
      borderColor: c.primary[500],
      backgroundColor: c.primary[500],
    },
    chainCopy: {
      flex: 1,
      minWidth: 0,
    },
    chainSymbol: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
    },
    chainSymbolActive: {
      color: c.primary[700],
    },
    chainName: {
      marginTop: 2,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
    },
    chainNameActive: {
      color: c.primary[700],
    },
  });
}

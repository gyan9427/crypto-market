import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import type { ThemeTokens } from '@/src/theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { CoinIcon } from './CoinIcon';
import { SearchBar } from './SearchBar';
import { fetchAllActiveCoins } from '@/src/services/api';
import type { Coin, TrendingCoin } from '@/src/types';

const MIN_COINS = 5;

export type CoinOnboardingModalProps = {
  visible: boolean;
  onComplete: (coinIds: string[]) => Promise<void>;
};

export function CoinOnboardingModal({ visible, onComplete }: CoinOnboardingModalProps) {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const c = tokens.colors;

  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');

  const loadCoins = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await fetchAllActiveCoins();
      setCoins(list);
    } catch {
      setLoadError(t('onboarding.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!visible) return;
    setSelected(new Set());
    setQuery('');
    setSubmitError(null);
    void loadCoins();
  }, [visible, loadCoins]);

  const filteredCoins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [coins, query]);

  const selectedCount = selected.size;
  const canContinue = selectedCount >= MIN_COINS && !submitting && !loading;

  const toggleCoin = (coinId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(coinId)) {
        next.delete(coinId);
      } else {
        next.add(coinId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selected.size < MIN_COINS || submitting || loading) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onComplete([...selected]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setSubmitError(
        message && !message.startsWith('HTTP error')
          ? message
          : t('onboarding.submitError')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderTile = ({ item }: { item: TrendingCoin }) => {
    const isSelected = selected.has(item.id);
    const coinForIcon: Coin = {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      logo: item.logo,
      price: item.price,
      change24h: item.change24h,
    };

    return (
      <TouchableOpacity
        style={[styles.tile, isSelected && styles.tileActive]}
        onPress={() => toggleCoin(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
        activeOpacity={0.82}
      >
        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
          {isSelected && <Check size={13} color={c.surface} strokeWidth={3} />}
        </View>
        <CoinIcon coin={coinForIcon} size={28} style={styles.coinIcon} />
        <View style={styles.tileCopy}>
          <Text style={[styles.tileSymbol, isSelected && styles.tileSymbolActive]} numberOfLines={1}>
            {item.symbol}
          </Text>
          <Text style={[styles.tileName, isSelected && styles.tileNameActive]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {}}>
      <View
        style={[
          styles.screen,
          { paddingTop: Math.max(insets.top, tokens.spacing.md), paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.coinPickerTitle')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.coinPickerSubtitle')}</Text>
          <Text style={styles.selectedCount}>
            {t('onboarding.selectedCount', { count: selectedCount })}
          </Text>
          {!loading && !loadError ? (
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t('onboarding.searchPlaceholder')}
              variant="embedded"
            />
          ) : null}
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={c.primary[500]} />
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadCoins()}>
              <Text style={styles.retryButtonText}>{t('onboarding.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredCoins}
            keyExtractor={(item) => item.id}
            renderItem={renderTile}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>{t('onboarding.noSearchResults')}</Text>
              </View>
            }
          />
        )}

        <View style={styles.footer}>
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <Pressable
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={() => void handleContinue()}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            accessibilityLabel={t('onboarding.continue')}
          >
            {submitting ? (
              <ActivityIndicator color={c.surface} />
            ) : (
              <Text style={styles.continueButtonText}>{t('onboarding.continue')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function buildStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    header: {
      paddingHorizontal: s.lg,
      paddingBottom: s.md,
    },
    title: {
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
      marginBottom: s.xs,
    },
    subtitle: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      lineHeight: 20,
      marginBottom: s.sm,
    },
    selectedCount: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[500],
      marginBottom: s.sm,
    },
    emptySearch: {
      paddingVertical: s.xl,
      paddingHorizontal: s.lg,
      alignItems: 'center',
    },
    emptySearchText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      textAlign: 'center',
    },
    listContent: {
      paddingHorizontal: s.lg,
      paddingBottom: s.md,
    },
    columnWrapper: {
      justifyContent: 'space-between',
      marginBottom: s.xs,
    },
    tile: {
      width: '48.5%',
      minHeight: 64,
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
      marginRight: s.xs,
      backgroundColor: tokens.surface,
    },
    checkCircleActive: {
      borderColor: c.primary[500],
      backgroundColor: c.primary[500],
    },
    coinIcon: {
      marginRight: s.xs,
    },
    tileCopy: {
      flex: 1,
      minWidth: 0,
    },
    tileSymbol: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
    },
    tileSymbolActive: {
      color: c.primary[800],
    },
    tileName: {
      fontSize: typo.fontSizes.xs,
      color: tokens.textMuted,
    },
    tileNameActive: {
      color: c.primary[700],
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s.lg,
    },
    footer: {
      paddingHorizontal: s.lg,
      paddingTop: s.md,
      paddingBottom: s.lg,
      borderTopWidth: 1,
      borderTopColor: tokens.borderSubtle,
      gap: s.sm,
    },
    continueButton: {
      minHeight: 48,
      borderRadius: sem.cardRadiusSmall,
      backgroundColor: c.primary[500],
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonDisabled: {
      opacity: 0.45,
    },
    continueButtonText: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: c.surface,
    },
    errorText: {
      fontSize: typo.fontSizes.sm,
      color: c.danger[500],
      textAlign: 'center',
    },
    retryButton: {
      marginTop: s.md,
      paddingHorizontal: s.lg,
      paddingVertical: s.sm,
      borderRadius: sem.cardRadiusSmall,
      backgroundColor: c.primary[500],
    },
    retryButtonText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.surface,
    },
  });
}

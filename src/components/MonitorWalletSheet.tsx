import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import type { ExchangeConnection } from '../types';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { ChainPills } from './ChainPills';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function exchangeStatusKey(status: ExchangeConnection['status']): string {
  switch (status) {
    case 'active':
      return 'monitorExchange.status_active';
    case 'invalid_credentials':
      return 'monitorExchange.status_invalid_credentials';
    case 'rate_limited':
      return 'monitorExchange.status_rate_limited';
    case 'error':
      return 'monitorExchange.status_error';
    case 'requires_reauth':
      return 'monitorExchange.status_requires_reauth';
    default:
      return 'monitorExchange.status_error';
  }
}

function providerLabel(ex: ExchangeConnection, t: (k: string) => string): string {
  if (ex.label?.trim()) return ex.label.trim();
  if (ex.provider === 'coindcx') return t('monitorExchange.providerCoinDcx');
  return ex.provider;
}

type SheetStyles = ReturnType<typeof buildMonitorWalletSheetStyles>;

interface WalletListItemProps {
  address: string;
  label?: string;
  onRemove(): void;
  sheetStyles: SheetStyles;
}

const WalletListItem: React.FC<WalletListItemProps> = ({ address, label, onRemove, sheetStyles: styles }) => (
  <View style={styles.walletListItem}>
    <Text style={styles.walletListItemLabel} numberOfLines={1}>
      {label || truncateAddress(address)}
    </Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
      <Text style={styles.walletListItemRemove}>✕</Text>
    </TouchableOpacity>
  </View>
);

interface MonitorWalletSheetProps {
  visible: boolean;
  onClose: () => void;
}

type SegmentId = 'wallet' | 'exchange';

export const MonitorWalletSheet: React.FC<MonitorWalletSheetProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildMonitorWalletSheetStyles(tokens), [tokens]);
  const c = tokens.colors;

  const {
    wallets,
    supportedChains,
    supportedChainsError,
    isLoading,
    error,
    loadWallets,
    loadSupportedChains,
    loadEvents,
    loadHoldings,
    addWallet,
    removeWallet,
    clearError,
    exchanges,
    exchangePortfolioEnabled,
    exchangesCatalogLoaded,
    exchangesLoading,
    exchangeMutationPending,
    exchangeError,
    loadExchanges,
    addCoinDcxExchange,
    patchCoinDcxExchange,
    removeExchangeConnection,
  } = usePortfolioStore();

  const [segment, setSegment] = useState<SegmentId>('wallet');

  const [addressInput, setAddressInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [walletConsentChecked, setWalletConsentChecked] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [exchangeLabelInput, setExchangeLabelInput] = useState('');
  const [exchangeFormError, setExchangeFormError] = useState<string | null>(null);
  const [editingExchangeId, setEditingExchangeId] = useState<string | null>(null);

  const chainsUnavailable = supportedChains.length === 0 || Boolean(supportedChainsError);
  const chainsUnavailableMessage =
    supportedChainsError || t('monitorWallet.errorChainsUnavailable');

  const [isClosing, setIsClosing] = useState(false);
  const slideY = useSharedValue(-600);
  const backdropOpacity = useSharedValue(0);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      loadSupportedChains();
      loadWallets();
      void loadExchanges();
      slideY.value = withSpring(0, { damping: 15, stiffness: 120 });
      backdropOpacity.value = withTiming(1, { duration: tokens.motion.duration.normal });
    } else {
      slideY.value = -600;
      backdropOpacity.value = 0;
      setSegment('wallet');
      setEditingExchangeId(null);
      setApiKeyInput('');
      setApiSecretInput('');
      setExchangeLabelInput('');
      setExchangeFormError(null);
      setAddError(null);
    }
  }, [visible, slideY, backdropOpacity, tokens.motion.duration.normal]);

  const finishClose = useCallback(() => {
    setIsClosing(false);
    onClose();
  }, [onClose]);

  const closeSheet = useCallback(() => {
    setIsClosing(true);
    slideY.value = withTiming(-600, { duration: tokens.motion.duration.fast }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
    backdropOpacity.value = withTiming(0, { duration: tokens.motion.duration.normal });
  }, [slideY, backdropOpacity, tokens.motion.duration.fast, tokens.motion.duration.normal, finishClose]);

  const handleBarPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy < -3,
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -40) closeSheet();
      },
    })
  ).current;

  const toggleChain = useCallback((chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((x) => x !== chainId) : [...prev, chainId]
    );
  }, []);

  const handleAddWallet = useCallback(async () => {
    const trimmed = addressInput.trim();
    setAddError(null);
    clearError();

    if (chainsUnavailable) {
      setAddError(chainsUnavailableMessage);
      return;
    }
    if (!trimmed) {
      setAddError(t('monitorWallet.errorAddressRequired'));
      return;
    }
    if (selectedChains.length === 0) {
      setAddError(t('monitorWallet.errorChainRequired'));
      return;
    }
    if (!walletConsentChecked) {
      setAddError(t('monitorWallet.errorConsentRequired', 'Please confirm third-party data sharing to add a wallet.'));
      return;
    }

    try {
      await addWallet(trimmed, selectedChains, labelInput.trim() || undefined);
      setAddressInput('');
      setLabelInput('');
      setSelectedChains([]);
      void loadEvents(1, 20, { triggerReason: 'manual_refresh' });
    } catch {
      // error is already set in the store
    }
  }, [
    addressInput,
    chainsUnavailable,
    chainsUnavailableMessage,
    labelInput,
    selectedChains,
    walletConsentChecked,
    addWallet,
    clearError,
    loadEvents,
    t,
  ]);

  const handleRemoveWallet = useCallback(
    (id: string) => {
      removeWallet(id);
    },
    [removeWallet]
  );

  const beginEditExchange = useCallback((ex: ExchangeConnection) => {
    setEditingExchangeId(ex.id);
    setExchangeLabelInput(ex.label?.trim() ?? '');
    setApiKeyInput('');
    setApiSecretInput('');
    setExchangeFormError(null);
    clearError();
  }, [clearError]);

  const cancelEditExchange = useCallback(() => {
    setEditingExchangeId(null);
    setApiKeyInput('');
    setApiSecretInput('');
    setExchangeFormError(null);
  }, []);

  const handleSubmitExchange = useCallback(async () => {
    const keyTrim = apiKeyInput.trim();
    const secretTrim = apiSecretInput.trim();
    setExchangeFormError(null);
    clearError();

    if (!exchangePortfolioEnabled || !exchangesCatalogLoaded) return;

    if (!keyTrim || !secretTrim) {
      setExchangeFormError(t('monitorExchange.errorCredentialsRequired'));
      return;
    }

    try {
      const label = exchangeLabelInput.trim() || undefined;
      if (editingExchangeId) {
        await patchCoinDcxExchange(editingExchangeId, keyTrim, secretTrim, label);
        cancelEditExchange();
      } else {
        await addCoinDcxExchange(keyTrim, secretTrim, label);
        setApiKeyInput('');
        setApiSecretInput('');
        setExchangeLabelInput('');
      }
      void loadHoldings(true, { triggerReason: 'manual_refresh' });
      void loadEvents(1, 20, { triggerReason: 'manual_refresh' });
    } catch {
      // store sets exchangeError
    }
  }, [
    addCoinDcxExchange,
    apiKeyInput,
    apiSecretInput,
    cancelEditExchange,
    clearError,
    editingExchangeId,
    exchangeLabelInput,
    exchangePortfolioEnabled,
    exchangesCatalogLoaded,
    loadEvents,
    loadHoldings,
    patchCoinDcxExchange,
    t,
  ]);

  const combinedExchangeError = exchangeFormError || exchangeError || null;

  const showModal = visible || isClosing;
  if (!showModal) return null;

  const exchangeBlocking =
    exchangesLoading && !exchangesCatalogLoaded;
  const primaryExchangeDisabled =
    exchangeMutationPending ||
    exchangeBlocking ||
    !exchangePortfolioEnabled ||
    !exchangesCatalogLoaded;

  return (
    <Modal transparent visible={showModal} animationType="none" onRequestClose={closeSheet}>
      <TouchableWithoutFeedback onPress={closeSheet}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
        <View style={styles.handleBarContainer} {...handleBarPan.panHandlers}>
          <View style={styles.handleBar} />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>{t('monitorSources.title')}</Text>
          <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={24} color={c.neutral[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentPill, segment === 'wallet' && styles.segmentPillActive]}
            onPress={() => setSegment('wallet')}
          >
            <Text style={[styles.segmentText, segment === 'wallet' && styles.segmentTextActive]}>
              {t('monitorSources.tabWallet')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentPill, segment === 'exchange' && styles.segmentPillActive]}
            onPress={() => setSegment('exchange')}
          >
            <Text style={[styles.segmentText, segment === 'exchange' && styles.segmentTextActive]}>
              {t('monitorSources.tabExchange')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {segment === 'wallet' ? (
            <>
              <Text style={styles.inputLabel}>{t('monitorWallet.selectChains')}</Text>
              <ChainPills
                chains={supportedChains}
                selectedChains={selectedChains}
                onToggle={toggleChain}
                disabled={chainsUnavailable}
              />

              <TextInput
                style={styles.input}
                placeholder={t('monitorWallet.addressPlaceholder')}
                placeholderTextColor={c.neutral[400]}
                value={addressInput}
                onChangeText={setAddressInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
              />

              <TextInput
                style={[styles.input, styles.inputSmall]}
                placeholder={t('monitorWallet.labelPlaceholder')}
                placeholderTextColor={c.neutral[400]}
                value={labelInput}
                onChangeText={setLabelInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {(addError || supportedChainsError || error) ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{addError || supportedChainsError || error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setWalletConsentChecked((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, walletConsentChecked && styles.checkboxChecked]}>
                  {walletConsentChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.consentText}>
                  {t(
                    'monitorWallet.consentLabel',
                    'I understand my wallet address will be shared with Zerion and Alchemy to fetch on-chain portfolio data.'
                  )}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, (isLoading || chainsUnavailable || !walletConsentChecked) && styles.addButtonDisabled]}
                onPress={handleAddWallet}
                disabled={isLoading || chainsUnavailable || !walletConsentChecked}
              >
                <Text style={styles.addButtonText}>
                  {isLoading ? t('monitorWallet.adding') : t('monitorWallet.addWallet')}
                </Text>
              </TouchableOpacity>

              {wallets.length > 0 && (
                <View style={styles.walletsSection}>
                  <Text style={styles.sectionTitle}>{t('monitorWallet.monitoredWallets')}</Text>
                  <View style={styles.walletList}>
                    {wallets.map((w) => (
                      <WalletListItem
                        key={w.id}
                        address={w.address}
                        label={w.label}
                        onRemove={() => handleRemoveWallet(w.id)}
                        sheetStyles={styles}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {exchangeBlocking ? (
                <View style={styles.exchangeLoadingRow}>
                  <ActivityIndicator color={c.primary[500]} />
                  <Text style={styles.exchangeLoadingText}>{t('monitorExchange.loadingExchanges')}</Text>
                </View>
              ) : null}

              {!exchangePortfolioEnabled && exchangesCatalogLoaded ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{t('monitorExchange.disabledHint')}</Text>
                </View>
              ) : null}

              {exchangePortfolioEnabled && exchangesCatalogLoaded ? (
                <>
                  <Text style={styles.inputLabel}>{t('monitorExchange.providerCoinDcx')}</Text>

                  <TextInput
                    style={styles.input}
                    placeholder={t('monitorExchange.apiKeyPlaceholder')}
                    placeholderTextColor={c.neutral[400]}
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!exchangeMutationPending}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder={t('monitorExchange.apiSecretPlaceholder')}
                    placeholderTextColor={c.neutral[400]}
                    value={apiSecretInput}
                    onChangeText={setApiSecretInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                    editable={!exchangeMutationPending}
                  />

                  <TextInput
                    style={[styles.input, styles.inputSmall]}
                    placeholder={t('monitorExchange.labelPlaceholder')}
                    placeholderTextColor={c.neutral[400]}
                    value={exchangeLabelInput}
                    onChangeText={setExchangeLabelInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!exchangeMutationPending}
                  />

                  {editingExchangeId ? (
                    <TouchableOpacity onPress={cancelEditExchange}>
                      <Text style={styles.cancelEditLink}>{t('monitorExchange.cancelEdit')}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {combinedExchangeError && exchangePortfolioEnabled ? (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{combinedExchangeError}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.addButton, primaryExchangeDisabled && styles.addButtonDisabled]}
                    onPress={handleSubmitExchange}
                    disabled={primaryExchangeDisabled}
                  >
                    <Text style={styles.addButtonText}>
                      {exchangeMutationPending
                        ? editingExchangeId
                          ? t('monitorExchange.updating')
                          : t('monitorExchange.adding')
                        : editingExchangeId
                          ? t('monitorExchange.updateExchange')
                          : t('monitorExchange.addExchange')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {exchanges.length > 0 && exchangePortfolioEnabled && exchangesCatalogLoaded ? (
                <View style={styles.walletsSection}>
                  <Text style={styles.sectionTitle}>{t('monitorExchange.linkedExchanges')}</Text>
                  <View style={styles.walletList}>
                    {exchanges.map((ex) => (
                      <View key={ex.id} style={styles.exchangeRow}>
                        <View style={styles.exchangeRowMain}>
                          <Text style={styles.exchangeRowTitle} numberOfLines={1}>
                            {providerLabel(ex, t)}
                          </Text>
                          <Text style={styles.exchangeRowMeta} numberOfLines={1}>
                            {t('monitorExchange.keyPrefix', { masked: ex.maskedApiKey })}
                          </Text>
                          <Text
                            style={[
                              styles.exchangeRowStatus,
                              (ex.requiresReauth || ex.status !== 'active') && styles.exchangeRowStatusWarn,
                            ]}
                          >
                            {ex.requiresReauth || ex.status !== 'active'
                              ? `${t(exchangeStatusKey(ex.status))} · ${t('monitorExchange.needsAttention')}`
                              : t(exchangeStatusKey(ex.status))}
                          </Text>
                        </View>
                        <View style={styles.exchangeRowActions}>
                          <TouchableOpacity onPress={() => beginEditExchange(ex)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                            <Text style={styles.exchangeEdit}>{t('monitorExchange.editConnection')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => void removeExchangeConnection(ex.id)}
                            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                            disabled={exchangeMutationPending}
                          >
                            <Text style={styles.walletListItemRemove}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

function buildMonitorWalletSheetStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const sem = tokens.semantic;
  const typo = tokens.typography;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: sem.backdrop,
    },
    sheet: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: sem.surface,
      borderBottomLeftRadius: sem.sheetRadius,
      borderBottomRightRadius: sem.sheetRadius,
      maxHeight: '85%',
      ...tokens.shadows.lg,
    },
    handleBarContainer: {
      paddingVertical: s.sm,
      paddingHorizontal: sem.listMarginH,
      alignItems: 'center',
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.neutral[300],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sem.listMarginH,
      paddingBottom: sem.cardPadding,
    },
    title: {
      fontSize: typo.fontSizes.xl,
      fontWeight: typo.fontWeights.bold,
      color: tokens.text,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: s.xs,
      paddingHorizontal: sem.listMarginH,
      marginBottom: s.md,
    },
    segmentPill: {
      flex: 1,
      paddingVertical: s.sm,
      borderRadius: br.button,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      alignItems: 'center',
      backgroundColor: tokens.inputBg,
    },
    segmentPillActive: {
      borderColor: c.primary[500],
      backgroundColor: c.primary[50],
    },
    segmentText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
    },
    segmentTextActive: {
      color: c.primary[700],
    },
    content: {
      paddingHorizontal: sem.listMarginH,
      paddingBottom: s.xxl,
    },
    inputLabel: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
      marginBottom: s.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      borderRadius: sem.cardRadiusSmall,
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      fontSize: typo.fontSizes.base,
      color: c.neutral[800],
      marginTop: s.sm,
      backgroundColor: tokens.inputBg,
    },
    inputSmall: {
      paddingVertical: s.sm,
      fontSize: typo.fontSizes.sm,
    },
    errorBanner: {
      marginTop: s.sm,
      backgroundColor: c.error[50],
      borderRadius: sem.cardRadiusSmall,
      padding: s.sm,
    },
    errorBannerText: {
      color: c.error[700],
      fontSize: typo.fontSizes.sm,
    },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: s.md,
      gap: s.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: c.neutral[400],
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: c.primary[500],
      borderColor: c.primary[500],
    },
    checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
    consentText: {
      flex: 1,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      lineHeight: 20,
    },
    cancelEditLink: {
      marginTop: s.sm,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[600],
    },
    exchangeLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
      marginBottom: s.md,
    },
    exchangeLoadingText: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    addButton: {
      marginTop: s.md,
      backgroundColor: c.primary[500],
      borderRadius: br.button,
      paddingVertical: s.sm,
      alignItems: 'center',
    },
    addButtonDisabled: {
      backgroundColor: c.neutral[300],
    },
    addButtonText: {
      color: c.surface,
      fontWeight: typo.fontWeights.semibold,
      fontSize: typo.fontSizes.base,
    },
    walletsSection: {
      marginTop: s.xl,
    },
    sectionTitle: {
      fontSize: typo.fontSizes.md,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
      marginBottom: s.sm,
    },
    walletList: {},
    walletListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: tokens.inputBg,
      borderColor: tokens.borderSubtle,
      borderWidth: 1,
      borderRadius: sem.cardRadiusSmall,
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      marginBottom: s.xs,
    },
    walletListItemLabel: {
      fontSize: typo.fontSizes.base,
      color: c.neutral[800],
      fontWeight: typo.fontWeights.medium,
      flex: 1,
    },
    walletListItemRemove: {
      fontSize: typo.fontSizes.base,
      color: c.neutral[400],
      fontWeight: typo.fontWeights.bold,
      marginLeft: s.sm,
    },
    exchangeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: tokens.inputBg,
      borderColor: tokens.borderSubtle,
      borderWidth: 1,
      borderRadius: sem.cardRadiusSmall,
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      marginBottom: s.xs,
    },
    exchangeRowMain: {
      flex: 1,
      paddingRight: s.sm,
    },
    exchangeRowTitle: {
      fontSize: typo.fontSizes.base,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[800],
    },
    exchangeRowMeta: {
      marginTop: 4,
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
    },
    exchangeRowStatus: {
      marginTop: 4,
      fontSize: typo.fontSizes.sm,
      color: c.neutral[600],
    },
    exchangeRowStatusWarn: {
      color: c.error[600],
    },
    exchangeRowActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.sm,
    },
    exchangeEdit: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[600],
    },
  });
}

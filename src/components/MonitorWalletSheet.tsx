import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { ChainPills } from './ChainPills';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
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
    addWallet,
    removeWallet,
    clearError,
  } = usePortfolioStore();

  const [addressInput, setAddressInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const chainsUnavailable = supportedChains.length === 0 || Boolean(supportedChainsError);
  const chainsUnavailableMessage =
    supportedChainsError || t('monitorWallet.errorChainsUnavailable');

  const [isClosing, setIsClosing] = useState(false);
  const slideAnim = useRef(new Animated.Value(-600)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      loadSupportedChains();
      loadWallets();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, bounciness: 4 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      slideAnim.setValue(-600);
      backdropAnim.setValue(0);
    }
  }, [visible]);

  const closeSheet = useCallback(() => {
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -600, duration: 220, useNativeDriver: false }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      setIsClosing(false);
      onClose();
    });
  }, [onClose, slideAnim, backdropAnim]);

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

  const showModal = visible || isClosing;
  if (!showModal) return null;

  return (
    <Modal transparent visible={showModal} animationType="none" onRequestClose={closeSheet}>
      <TouchableWithoutFeedback onPress={closeSheet}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handleBarContainer} {...handleBarPan.panHandlers}>
          <View style={styles.handleBar} />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>{t('monitorWallet.title')}</Text>
          <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={24} color={c.neutral[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            style={[styles.addButton, (isLoading || chainsUnavailable) && styles.addButtonDisabled]}
            onPress={handleAddWallet}
            disabled={isLoading || chainsUnavailable}
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
  });
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { X } from 'lucide-react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { ChainPills } from './ChainPills';
import { colors, spacing, borderRadius, shadows, typography, semantic } from '../theme/theme';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

interface WalletListItemProps {
  address: string;
  label?: string;
  onRemove(): void;
}

const WalletListItem: React.FC<WalletListItemProps> = ({ address, label, onRemove }) => (
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
  const {
    wallets,
    supportedChains,
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
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId]
    );
  }, []);

  const handleAddWallet = useCallback(async () => {
    const trimmed = addressInput.trim();
    setAddError(null);
    clearError();

    if (!trimmed) {
      setAddError('Please enter a wallet address.');
      return;
    }
    if (selectedChains.length === 0) {
      setAddError('Please select at least one chain.');
      return;
    }

    try {
      await addWallet(trimmed, selectedChains, labelInput.trim() || undefined);
      setAddressInput('');
      setLabelInput('');
      setSelectedChains([]);
      loadEvents();
    } catch {
      // error is already set in the store
    }
  }, [addressInput, labelInput, selectedChains, addWallet, clearError, loadEvents]);

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
          <Text style={styles.title}>Monitor Wallet</Text>
          <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={24} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.inputLabel}>Select Chains</Text>
          <ChainPills
            chains={supportedChains}
            selectedChains={selectedChains}
            onToggle={toggleChain}
          />

          <TextInput
            style={styles.input}
            placeholder="Wallet address (0x…)"
            placeholderTextColor={colors.neutral[400]}
            value={addressInput}
            onChangeText={setAddressInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />

          <TextInput
            style={[styles.input, styles.inputSmall]}
            placeholder="Label (optional)"
            placeholderTextColor={colors.neutral[400]}
            value={labelInput}
            onChangeText={setLabelInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {(addError || error) ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{addError || error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={handleAddWallet}
            disabled={isLoading}
          >
            <Text style={styles.addButtonText}>
              {isLoading ? 'Adding…' : 'Add Wallet'}
            </Text>
          </TouchableOpacity>

          {wallets.length > 0 && (
            <View style={styles.walletsSection}>
              <Text style={styles.sectionTitle}>Monitored Wallets</Text>
              <View style={styles.walletList}>
                {wallets.map((w) => (
                  <WalletListItem
                    key={w.id}
                    address={w.address}
                    label={w.label}
                    onRemove={() => handleRemoveWallet(w.id)}
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

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: semantic.backdrop,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: semantic.surface,
    borderBottomLeftRadius: semantic.sheetRadius,
    borderBottomRightRadius: semantic.sheetRadius,
    maxHeight: '85%',
    ...shadows.lg,
  },
  handleBarContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: semantic.listMarginH,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: semantic.listMarginH,
    paddingBottom: semantic.cardPadding,
  },
  title: {
    fontSize:     typography.fontSizes.xl,
    fontWeight:   typography.fontWeights.bold,
    color:        colors.neutral[900],
  },
  content: {
    paddingHorizontal: semantic.listMarginH,
    paddingBottom:     spacing.xxl,
  },
  inputLabel: {
    fontSize:     typography.fontSizes.sm,
    fontWeight:   typography.fontWeights.medium,
    color:        colors.neutral[600],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth:       1,
    borderColor:       colors.neutral[200],
    borderRadius:      semantic.cardRadiusSmall,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    fontSize:          typography.fontSizes.base,
    color:             colors.neutral[800],
    marginTop:         spacing.sm,
    backgroundColor:   colors.neutral[50],
  },
  inputSmall: {
    paddingVertical: spacing.sm,
    fontSize:         typography.fontSizes.sm,
  },
  errorBanner: {
    marginTop:       spacing.sm,
    backgroundColor: colors.error[50],
    borderRadius:    semantic.cardRadiusSmall,
    padding:         spacing.sm,
  },
  errorBannerText: {
    color:    colors.error[700],
    fontSize: typography.fontSizes.sm,
  },
  addButton: {
    marginTop:       spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius:   borderRadius.button,
    paddingVertical: spacing.sm,
    alignItems:     'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  addButtonText: {
    color:      colors.surface,
    fontWeight: typography.fontWeights.semibold,
    fontSize:   typography.fontSizes.base,
  },
  walletsSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize:     typography.fontSizes.md,
    fontWeight:   typography.fontWeights.semibold,
    color:        colors.neutral[800],
    marginBottom: spacing.sm,
  },
  walletList: {},
  walletListItem: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   colors.neutral[50],
    borderColor:       colors.neutral[200],
    borderWidth:       1,
    borderRadius:      semantic.cardRadiusSmall,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    marginBottom:      spacing.xs,
  },
  walletListItemLabel: {
    fontSize:   typography.fontSizes.base,
    color:      colors.neutral[800],
    fontWeight: typography.fontWeights.medium,
    flex:       1,
  },
  walletListItemRemove: {
    fontSize:   typography.fontSizes.base,
    color:      colors.neutral[400],
    fontWeight: typography.fontWeights.bold,
    marginLeft: spacing.sm,
  },
});

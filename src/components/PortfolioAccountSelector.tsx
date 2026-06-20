import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wallet, ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import type { ExchangeConnection, WalletAddress } from '../types';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import {
  getAccountSelectionLabel,
  isSameAccountSelection,
  type PortfolioAccountSelection,
} from '@/src/utils/portfolioAccountFilter';

const MARKET_ACCENT = '#6383ff';

type SourceTab = 'wallet' | 'exchange';

function sourceTabForSelection(selection: PortfolioAccountSelection): SourceTab {
  if (selection.kind === 'all_exchanges' || selection.kind === 'exchange') {
    return 'exchange';
  }
  return 'wallet';
}

interface SectionTabBarProps {
  activeTab: SourceTab;
  showExchangeTab: boolean;
  onTabChange: (tab: SourceTab) => void;
  walletLabel: string;
  exchangeLabel: string;
  styles: ReturnType<typeof buildStyles>;
}

const SectionTabBar: React.FC<SectionTabBarProps> = ({
  activeTab,
  showExchangeTab,
  onTabChange,
  walletLabel,
  exchangeLabel,
  styles,
}) => (
  <View style={styles.sectionTabBar}>
    <TouchableOpacity
      style={[styles.sectionTab, activeTab === 'wallet' && styles.sectionTabActive]}
      onPress={() => onTabChange('wallet')}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeTab === 'wallet' }}
    >
      <Text
        style={[styles.sectionTabLabel, activeTab === 'wallet' && styles.sectionTabLabelActive]}
      >
        {walletLabel}
      </Text>
    </TouchableOpacity>
    {showExchangeTab ? (
      <TouchableOpacity
        style={[styles.sectionTab, activeTab === 'exchange' && styles.sectionTabActive]}
        onPress={() => onTabChange('exchange')}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'exchange' }}
      >
        <Text
          style={[
            styles.sectionTabLabel,
            activeTab === 'exchange' && styles.sectionTabLabelActive,
          ]}
        >
          {exchangeLabel}
        </Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function walletRowLabel(wallet: WalletAddress): string {
  return wallet.label?.trim() || truncateAddress(wallet.address);
}

function exchangeRowLabel(ex: ExchangeConnection, t: (k: string) => string): string {
  if (ex.label?.trim()) return ex.label.trim();
  if (ex.provider === 'coindcx') return t('monitorExchange.providerCoinDcx');
  return ex.provider;
}

interface PortfolioAccountSelectorProps {
  wallets: WalletAddress[];
  exchanges: ExchangeConnection[];
  exchangePortfolioEnabled: boolean;
  selectedAccount: PortfolioAccountSelection;
  sessionStatus: string;
  onSelect: (selection: PortfolioAccountSelection) => void;
  onManageAccounts: () => void;
}

interface SelectorRowProps {
  selected: boolean;
  label: string;
  sublabel?: string;
  indented?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof buildStyles>;
}

const SelectorRow: React.FC<SelectorRowProps> = ({
  selected,
  label,
  sublabel,
  indented,
  onPress,
  styles,
}) => (
  <TouchableOpacity
    style={[styles.selectorRow, indented && styles.selectorRowIndented]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
  >
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
    <View style={styles.selectorRowText}>
      <Text style={styles.selectorRowLabel} numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={styles.selectorRowSublabel} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

export const PortfolioAccountSelector: React.FC<PortfolioAccountSelectorProps> = ({
  wallets,
  exchanges,
  exchangePortfolioEnabled,
  selectedAccount,
  sessionStatus,
  onSelect,
  onManageAccounts,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const [open, setOpen] = useState(false);
  const [activeSourceTab, setActiveSourceTab] = useState<SourceTab>('wallet');

  const showExchangeSection = exchangePortfolioEnabled && exchanges.length > 0;
  const triggerLabel = getAccountSelectionLabel(selectedAccount, t, wallets, exchanges);

  const close = useCallback(() => setOpen(false), []);

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        setActiveSourceTab(sourceTabForSelection(selectedAccount));
      }
      return !wasOpen;
    });
  }, [selectedAccount]);

  const pick = useCallback(
    (selection: PortfolioAccountSelection) => {
      onSelect(selection);
      close();
    },
    [onSelect, close]
  );

  const handleManage = useCallback(() => {
    close();
    onManageAccounts();
  }, [close, onManageAccounts]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>{t('portfolio.headerAccount')}</Text>
      <TouchableOpacity
        style={styles.triggerRow}
        onPress={toggleOpen}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={triggerLabel}
      >
        <View style={styles.accountIcon}>
          <Wallet size={18} color={MARKET_ACCENT} />
        </View>
        <View style={styles.identity}>
          <Text style={styles.accountTitle} numberOfLines={1}>
            {triggerLabel}
          </Text>
          <Text style={styles.sessionLabel} numberOfLines={1}>
            {sessionStatus}
          </Text>
        </View>
        {open ? (
          <ChevronUp size={20} color={tokens.textMuted} />
        ) : (
          <ChevronDown size={20} color={tokens.textMuted} />
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close account menu" />
          <View style={styles.panel}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <SelectorRow
                selected={isSameAccountSelection(selectedAccount, { kind: 'entire_portfolio' })}
                label={t('portfolio.entirePortfolio')}
                onPress={() => pick({ kind: 'entire_portfolio' })}
                styles={styles}
              />

              <SectionTabBar
                activeTab={activeSourceTab}
                showExchangeTab={showExchangeSection}
                onTabChange={setActiveSourceTab}
                walletLabel={t('portfolio.sectionWallet')}
                exchangeLabel={t('portfolio.sectionExchange')}
                styles={styles}
              />

              {activeSourceTab === 'wallet' ? (
                <>
                  <SelectorRow
                    selected={isSameAccountSelection(selectedAccount, { kind: 'all_wallets' })}
                    label={t('portfolio.allWallets')}
                    onPress={() => pick({ kind: 'all_wallets' })}
                    styles={styles}
                  />
                  {wallets.map((wallet) => (
                    <SelectorRow
                      key={wallet.id}
                      selected={isSameAccountSelection(selectedAccount, {
                        kind: 'wallet',
                        id: wallet.id,
                        address: wallet.address,
                        label: wallet.label,
                      })}
                      label={walletRowLabel(wallet)}
                      sublabel={wallet.label ? truncateAddress(wallet.address) : undefined}
                      indented
                      onPress={() =>
                        pick({
                          kind: 'wallet',
                          id: wallet.id,
                          address: wallet.address,
                          label: wallet.label,
                        })
                      }
                      styles={styles}
                    />
                  ))}
                </>
              ) : null}

              {activeSourceTab === 'exchange' && showExchangeSection ? (
                <>
                  <SelectorRow
                    selected={isSameAccountSelection(selectedAccount, { kind: 'all_exchanges' })}
                    label={t('portfolio.allExchanges')}
                    onPress={() => pick({ kind: 'all_exchanges' })}
                    styles={styles}
                  />
                  {exchanges.map((ex) => (
                    <SelectorRow
                      key={ex.id}
                      selected={isSameAccountSelection(selectedAccount, {
                        kind: 'exchange',
                        id: ex.id,
                        label: ex.label,
                        provider: ex.provider,
                      })}
                      label={exchangeRowLabel(ex, t)}
                      sublabel={ex.maskedApiKey}
                      indented
                      onPress={() =>
                        pick({
                          kind: 'exchange',
                          id: ex.id,
                          label: ex.label,
                          provider: ex.provider,
                        })
                      }
                      styles={styles}
                    />
                  ))}
                </>
              ) : null}

              <View style={styles.blockDivider} />
              <TouchableOpacity
                style={styles.manageRow}
                onPress={handleManage}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Plus size={16} color={MARKET_ACCENT} />
                <Text style={styles.manageText}>{t('portfolio.manageAccounts')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const rowBg = tokens.isDark ? '#0a0a0f' : tokens.surface;
  const panelBg = tokens.isDark ? '#12121a' : tokens.surface;

  return StyleSheet.create({
    wrapper: {},
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
      letterSpacing: 0.2,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    accountIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.sm,
    },
    identity: {
      flex: 1,
      minWidth: 0,
    },
    accountTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    sessionLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalRoot: {
      flex: 1,
      paddingTop: 100,
      paddingHorizontal: 12,
    },
    panel: {
      backgroundColor: panelBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.1)' : tokens.borderSubtle,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
    },
    selectorRowIndented: {
      paddingLeft: 40,
    },
    radioOuter: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: tokens.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioOuterSelected: {
      borderColor: MARKET_ACCENT,
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: MARKET_ACCENT,
    },
    selectorRowText: {
      flex: 1,
      minWidth: 0,
    },
    selectorRowLabel: {
      fontSize: typo.fontSizes.sm,
      color: tokens.text,
      fontWeight: typo.fontWeights.medium,
    },
    selectorRowSublabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
    },
    sectionTabBar: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    },
    sectionTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    sectionTabActive: {
      borderBottomColor: MARKET_ACCENT,
    },
    sectionTabLabel: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionTabLabelActive: {
      color: MARKET_ACCENT,
    },
    blockDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      marginHorizontal: 16,
    },
    manageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    manageText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: MARKET_ACCENT,
    },
  });
}

import React, { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  BackHandler,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { WalletEvent } from '../types';
import { isExchangePortfolioEvent } from '@/src/utils/portfolioSource';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';

const MARKET_ACCENT = '#6383ff';

function eventTypeLabel(t: TFunction, type: string): string {
  const keys: Record<string, string> = {
    token_transfer: 'activity.eventTypeTokenTransfer',
    native_transfer: 'activity.eventTypeNativeTransfer',
    contract_interaction: 'activity.eventTypeContractInteraction',
    multi_chain_activity: 'activity.eventTypeMultiChain',
    exchange_trade: 'activity.eventTypeExchangeTrade',
  };
  const k = keys[type];
  return k ? t(k) : type;
}

function txStatusLabel(t: TFunction, status: string): string {
  const keys: Record<string, string> = {
    success: 'activity.statusSuccess',
    failed: 'activity.statusFailed',
    pending: 'activity.statusPending',
  };
  const k = keys[status];
  return k ? t(k) : status;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function truncateHash(hash: string): string {
  if (hash.length <= 22) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Map MATIC to POL for display (Polygon rebrand) */
function mapAssetDisplay(text: string): string {
  return text.replace(/\bMATIC\b/gi, 'POL');
}

function formatActivityAmount(value: number | undefined, asset: string | undefined): string | null {
  const displayAsset = asset ? mapAssetDisplay(asset) : '';
  if (value == null || Number.isNaN(value)) return displayAsset || null;

  const formattedValue = value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 1 ? 6 : 8,
  });
  return displayAsset ? `${formattedValue} ${displayAsset}` : formattedValue;
}

function canonicalizeSymbol(text: string | undefined | null): string {
  const raw = (text ?? '').trim().toUpperCase();
  if (!raw) return '';
  return raw === 'MATIC' ? 'POL' : raw;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CHAIN_NATIVE_SYMBOL_ALIASES: Record<string, string[]> = {
  polygon: ['POL', 'MATIC'],
  eth: ['ETH'],
  ethereum: ['ETH'],
  bnb: ['BNB'],
  'binance-smart-chain': ['BNB'],
  arb: ['ETH'],
  arbitrum: ['ETH'],
  opt: ['ETH'],
  optimism: ['ETH'],
  base: ['ETH'],
};

const CHAIN_ID_ALIASES: Record<string, string> = {
  eth: 'eth',
  ethereum: 'eth',
  'chain_1': 'eth',
  'chain-1': 'eth',
  '1': 'eth',
  polygon: 'polygon',
  matic: 'polygon',
  'chain_137': 'polygon',
  'chain-137': 'polygon',
  '137': 'polygon',
  bnb: 'bnb',
  bsc: 'bnb',
  'binance-smart-chain': 'bnb',
  'chain_56': 'bnb',
  'chain-56': 'bnb',
  '56': 'bnb',
  arb: 'arb',
  arbitrum: 'arb',
  'arbitrum-one': 'arb',
  'chain_42161': 'arb',
  'chain-42161': 'arb',
  '42161': 'arb',
  sol: 'sol',
  solana: 'sol',
  coindcx: 'coindcx',
};

function canonicalizeChain(chain: string | undefined): string {
  const normalized = (chain ?? '').trim().toLowerCase();
  return CHAIN_ID_ALIASES[normalized] ?? normalized;
}

function matchesNativeChainAsset(symbol: string, chain: string | undefined, event: WalletEvent): boolean {
  if (!chain || event.type !== 'native_transfer') return false;
  const aliases = CHAIN_NATIVE_SYMBOL_ALIASES[chain.toLowerCase()] ?? [];
  const normalizedSymbol = canonicalizeSymbol(symbol);
  if (!aliases.map(canonicalizeSymbol).includes(normalizedSymbol)) return false;
  return event.chain.toLowerCase() === chain.toLowerCase();
}

function venueDisplayLabelActivity(venue: string | undefined): string {
  const v = (venue ?? '').toLowerCase();
  if (v === 'coindcx') return 'CoinDCX';
  return venue ? venue.toUpperCase() : '';
}

function tradeSideFromEvent(event: WalletEvent): 'buy' | 'sell' | undefined {
  const summariesText = (event.eventSummaries ?? []).join(' ').toLowerCase();
  if (/\bbuy\b/.test(summariesText)) return 'buy';
  if (/\bsell\b/.test(summariesText)) return 'sell';

  const ed = event.enrichedData as Record<string, unknown> | undefined;
  const row = ed?.row as Record<string, unknown> | undefined;
  const rawSide = row?.side ?? row?.order_side ?? '';
  const s = String(rawSide).toLowerCase();
  if (s.includes('buy')) return 'buy';
  if (s.includes('sell')) return 'sell';
  return undefined;
}

function tradePriceHint(event: WalletEvent): string | null {
  const ed = event.enrichedData as Record<string, unknown> | undefined;
  const row = ed?.row as Record<string, unknown> | undefined;
  const raw =
    row?.price ??
    row?.trade_price ??
    row?.execution_price ??
    row?.average_price;
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

type ActivityStyles = ReturnType<typeof buildActivityScreenStyles>;
type ActivityViewMode = 'batch' | 'list';

// ── Batch event row ──────────────────────────────────────────────────────────

interface EventRowProps {
  event: WalletEvent;
  styles: ActivityStyles;
}

const MAX_SUMMARIES_VISIBLE = 3;

const EventRow: React.FC<EventRowProps> = ({ event, styles }) => {
  const { t } = useTranslation();
  const activity = event.activity;
  const txStatus = activity?.txStatus;
  const explorerUrl = activity?.explorerUrl;
  const txCount = event.transactionCount;
  const summaries = event.eventSummaries ?? [];

  const hasNewFormat = txCount != null && summaries.length > 0;
  const summaryLine = hasNewFormat
    ? `${txCount} ${txCount !== 1 ? t('activity.transactionPlural') : t('activity.transactionSingular')}, ${summaries.length} ${summaries.length !== 1 ? t('activity.eventPlural') : t('activity.eventSingular')}`
    : null;
  const visibleSummaries = summaries.slice(0, MAX_SUMMARIES_VISIBLE);
  const remainingCount = summaries.length - MAX_SUMMARIES_VISIBLE;
  const primaryAsset = mapAssetDisplay(activity?.asset ?? '');
  const primaryTxHint =
    hasNewFormat && primaryAsset
      ? t('activity.primaryTxHint', { asset: primaryAsset })
      : null;

  return (
    <View style={styles.eventRow}>
      <View style={styles.eventLeft}>
        <View style={[styles.chainBadge]}>
          <Text style={styles.chainBadgeText}>{event.chain.toUpperCase()}</Text>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventType} numberOfLines={1}>
            {eventTypeLabel(t, event.type)}
          </Text>
          <Text style={styles.eventAddress}>{truncateAddress(event.address)}</Text>
          {txStatus && (
            <View style={[
              styles.statusBadge,
              txStatus === 'success' && styles.statusSuccess,
              txStatus === 'failed' && styles.statusFailed,
              txStatus === 'pending' && styles.statusPending,
            ]}>
              <Text style={styles.statusBadgeText}>
                {txStatusLabel(t, txStatus)}
              </Text>
            </View>
          )}
          {explorerUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(explorerUrl)}
              style={styles.explorerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.explorerLinkText}>{t('activity.viewOnExplorer')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.eventRight}>
        <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
        {(summaryLine || visibleSummaries.length > 0) && (
          <View style={styles.transactionDetails}>
            {summaryLine && (
              <Text style={styles.summaryLine}>{summaryLine}</Text>
            )}
            {visibleSummaries.length > 0 && (
              <View style={styles.eventSummaries}>
                {visibleSummaries.map((s, i) => (
                  <Text key={i} style={styles.eventSummaryItem} numberOfLines={2}>
                    • {mapAssetDisplay(s)}
                  </Text>
                ))}
                {remainingCount > 0 && (
                  <Text style={styles.eventSummaryMore}>{t('activity.andMore', { count: remainingCount })}</Text>
                )}
              </View>
            )}
            {primaryTxHint && (
              <Text style={styles.eventSummaryMore}>{primaryTxHint}</Text>
            )}
          </View>
        )}
        {!hasNewFormat && event.rawEventCount > 1 && (
          <Text style={styles.eventCount}>×{event.rawEventCount}</Text>
        )}
      </View>
    </View>
  );
};

// ── Individual transaction row ──────────────────────────────────────────────

interface TransactionDetailProps {
  label: string;
  value?: string | number | null;
  styles: ActivityStyles;
  mono?: boolean;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({
  label,
  value,
  styles,
  mono = false,
}) => {
  if (value == null || value === '') return null;

  return (
    <View style={styles.transactionDetailRow}>
      <Text style={styles.transactionDetailLabel}>{label}</Text>
      <Text
        style={[
          styles.transactionDetailValue,
          mono && styles.transactionDetailValueMono,
        ]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
};

function transactionDirectionLabel(t: TFunction, event: WalletEvent): string {
  const monitoredAddress = event.address.toLowerCase();
  const fromAddress = event.activity?.fromAddress?.toLowerCase();
  const toAddress = event.activity?.toAddress?.toLowerCase();

  if (fromAddress === monitoredAddress && toAddress !== monitoredAddress) {
    return t('activity.directionSent');
  }
  if (toAddress === monitoredAddress && fromAddress !== monitoredAddress) {
    return t('activity.directionReceived');
  }
  return t('activity.directionInvolved');
}

const TransactionEventRow: React.FC<EventRowProps> = ({ event, styles }) => {
  const { t } = useTranslation();
  const activity = event.activity;
  const txStatus = activity?.txStatus;
  const explorerUrl = activity?.explorerUrl;
  const amount = formatActivityAmount(activity?.value, activity?.asset);
  const direction = transactionDirectionLabel(t, event);

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionTitleBlock}>
          <View style={styles.transactionMetaRow}>
            <View style={[styles.chainBadge]}>
              <Text style={styles.chainBadgeText}>{event.chain.toUpperCase()}</Text>
            </View>
            <View style={styles.directionBadge}>
              <Text style={styles.directionBadgeText}>{direction}</Text>
            </View>
          </View>
          <Text style={styles.eventType} numberOfLines={1}>
            {eventTypeLabel(t, event.type)}
          </Text>
        </View>
        <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
      </View>

      {amount && (
        <Text style={styles.transactionAmount} numberOfLines={1}>
          {amount}
        </Text>
      )}

      {txStatus && (
        <View style={styles.transactionBadges}>
          <View style={[
            styles.statusBadge,
            styles.transactionStatusBadge,
            txStatus === 'success' && styles.statusSuccess,
            txStatus === 'failed' && styles.statusFailed,
            txStatus === 'pending' && styles.statusPending,
          ]}>
            <Text style={styles.statusBadgeText}>
              {txStatusLabel(t, txStatus)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.transactionDetailsBlock}>
        <TransactionDetail
          label={t('activity.from')}
          value={activity?.fromAddress ? truncateAddress(activity.fromAddress) : null}
          styles={styles}
          mono
        />
        <TransactionDetail
          label={t('activity.to')}
          value={activity?.toAddress ? truncateAddress(activity.toAddress) : null}
          styles={styles}
          mono
        />
        <TransactionDetail
          label={t('activity.hash')}
          value={activity?.txHash ? truncateHash(activity.txHash) : null}
          styles={styles}
          mono
        />
        <TransactionDetail
          label={t('activity.block')}
          value={activity?.blockNum}
          styles={styles}
          mono
        />
        <TransactionDetail
          label={t('activity.contract')}
          value={activity?.tokenContract ? truncateAddress(activity.tokenContract) : null}
          styles={styles}
          mono
        />
      </View>

      {explorerUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL(explorerUrl)}
          style={styles.transactionExplorerLink}
          activeOpacity={0.7}
        >
          <Text style={styles.explorerLinkText}>{t('activity.viewOnExplorer')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Exchange trade rows ─────────────────────────────────────────────────────

interface ExchangeTradeRowProps extends EventRowProps {
  viewMode: ActivityViewMode;
}

const ExchangeTradeRow: React.FC<ExchangeTradeRowProps> = ({ event, styles, viewMode }) => {
  const { t } = useTranslation();
  const activity = event.activity;
  const txStatus = activity?.txStatus;
  const venue = venueDisplayLabelActivity(event.venue);
  const side = tradeSideFromEvent(event);
  const amount = formatActivityAmount(activity?.value, activity?.asset);
  const tradeIdRaw = activity?.tradeId ?? event.providerTradeId ?? '';
  const tradeIdDisplay = tradeIdRaw ? truncateHash(tradeIdRaw) : '';
  const priceHint = tradePriceHint(event);

  const sideLabel =
    side === 'buy'
      ? t('activity.directionBuy')
      : side === 'sell'
        ? t('activity.directionSell')
        : '';

  const summaries = event.eventSummaries ?? [];

  if (viewMode === 'batch') {
    return (
      <View style={styles.eventRow}>
        <View style={styles.eventLeft}>
          <View style={styles.venueBadge}>
            <Text style={styles.venueBadgeText}>{venue || t('activity.venue')}</Text>
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventType} numberOfLines={1}>
              {eventTypeLabel(t, event.type)}
            </Text>
            <Text style={styles.eventAddress} numberOfLines={1}>
              {tradeIdDisplay || truncateAddress(event.address)}
            </Text>
            {sideLabel ? (
              <View style={styles.directionBadge}>
                <Text style={styles.directionBadgeText}>{sideLabel}</Text>
              </View>
            ) : null}
            {txStatus ? (
              <View style={[
                styles.statusBadge,
                txStatus === 'success' && styles.statusSuccess,
                txStatus === 'failed' && styles.statusFailed,
                txStatus === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.statusBadgeText}>
                  {txStatusLabel(t, txStatus)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.eventRight}>
          <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
          {amount ? <Text style={styles.exchangeBatchAmount}>{amount}</Text> : null}
          {summaries.length > 0 ? (
            <View style={styles.transactionDetails}>
              {summaries.slice(0, MAX_SUMMARIES_VISIBLE).map((s, i) => (
                <Text key={i} style={styles.eventSummaryItem} numberOfLines={2}>
                  • {mapAssetDisplay(s)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionTitleBlock}>
          <View style={styles.transactionMetaRow}>
            <View style={styles.venueBadge}>
              <Text style={styles.venueBadgeText}>{venue || t('activity.venue')}</Text>
            </View>
            {sideLabel ? (
              <View style={styles.directionBadge}>
                <Text style={styles.directionBadgeText}>{sideLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.eventType} numberOfLines={1}>
            {eventTypeLabel(t, event.type)}
          </Text>
        </View>
        <Text style={styles.eventTime}>{formatTime(event.aggregatedAt)}</Text>
      </View>

      {amount ? (
        <Text style={styles.transactionAmount} numberOfLines={1}>
          {amount}
        </Text>
      ) : null}

      {txStatus ? (
        <View style={styles.transactionBadges}>
          <View style={[
            styles.statusBadge,
            styles.transactionStatusBadge,
            txStatus === 'success' && styles.statusSuccess,
            txStatus === 'failed' && styles.statusFailed,
            txStatus === 'pending' && styles.statusPending,
          ]}>
            <Text style={styles.statusBadgeText}>
              {txStatusLabel(t, txStatus)}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.transactionDetailsBlock}>
        <TransactionDetail
          label={t('activity.tradeId')}
          value={tradeIdDisplay || tradeIdRaw}
          styles={styles}
          mono
        />
        <TransactionDetail
          label={t('activity.venue')}
          value={venue}
          styles={styles}
        />
        {priceHint ? (
          <TransactionDetail label={t('activity.tradePrice')} value={priceHint} styles={styles} />
        ) : null}
      </View>
    </View>
  );
};

// ── Main screen ──────────────────────────────────────────────────────────────

interface ActivityScreenProps {
  symbol?: string;
  chain?: string;
  onClose: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ symbol, chain, onClose }) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildActivityScreenStyles(tokens), [tokens]);
  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers();
  const events = usePortfolioStore((state) => state.events);
  const isLoading = usePortfolioStore((state) => state.isLoading);
  const statusRefreshWarning = usePortfolioStore((state) => state.statusRefreshWarning);

  const [viewMode, setViewMode] = useState<ActivityViewMode>('batch');

  const viewOptions = useMemo(
    () => [t('activity.batchView'), t('activity.listView')],
    [t]
  );
  const selectedViewIndex = viewMode === 'batch' ? 0 : 1;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  // Filter by symbol/chain when provided
  const filteredEvents = useMemo(() => {
    let list = events;

    if (!symbol) return list;

    const normalizedSymbol = canonicalizeSymbol(symbol);
    const selectedChain = canonicalizeChain(chain);
    const symbolPattern = new RegExp(`\\b${escapeRegExp(normalizedSymbol)}\\b`, 'i');

    return list.filter(event => {
      if (selectedChain) {
        const eventChain = canonicalizeChain(event.chain);
        if (eventChain !== selectedChain) return false;
      }
      const summaries = event.eventSummaries ?? [];
      const summaryMatches = summaries.some((summary) =>
        symbolPattern.test(canonicalizeSymbol(summary))
      );
      const activityAsset = canonicalizeSymbol(event.activity?.asset);
      const nativeChainMatch = matchesNativeChainAsset(normalizedSymbol, chain, event);

      const exchangePairMatch = isExchangePortfolioEvent(event) && activityAsset.startsWith(normalizedSymbol);

      return summaryMatches || activityAsset === normalizedSymbol || nativeChainMatch || exchangePairMatch;
    });
  }, [chain, events, symbol]);

  const renderItem = ({ item }: { item: WalletEvent }) => {
    if (isExchangePortfolioEvent(item)) {
      return <ExchangeTradeRow event={item} styles={styles} viewMode={viewMode} />;
    }
    if (viewMode === 'list') {
      return <TransactionEventRow event={item} styles={styles} />;
    }
    return <EventRow event={item} styles={styles} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.backIconBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('coin.goBack')}
        >
          <ChevronLeft size={18} color={MARKET_ACCENT} />
        </TouchableOpacity>
        <View style={styles.identity}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {symbol ? t('activity.titleWithSymbol', { symbol }) : t('activity.title')}
          </Text>
          <Text style={styles.activitySubtitle} numberOfLines={1}>
            {t('activity.transactionCount', { count: filteredEvents.length })}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {viewOptions.map((option, index) => (
          <TouchableOpacity
            key={option}
            style={[styles.tab, selectedViewIndex === index && styles.tabActive]}
            onPress={() => setViewMode(index === 0 ? 'batch' : 'list')}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedViewIndex === index }}
          >
            <Text style={[styles.tabText, selectedViewIndex === index && styles.tabTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {statusRefreshWarning ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>{statusRefreshWarning}</Text>
        </View>
      ) : null}
      <Animated.FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={viewMode}
        {...collapsibleScrollHandlers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <>
                <Text style={styles.emptyTitle}>{t('activity.loading')}</Text>
                <Text style={styles.emptySubtitle}>{t('coin.refreshingData')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>{t('activity.noActivityFound')}</Text>
                <Text style={styles.emptySubtitle}>
                  {symbol
                    ? t('activity.emptyForSymbol', { symbol })
                    : t('activity.empty')}
                </Text>
              </>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

function buildActivityScreenStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const typo = tokens.typography;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const rowBg = tokens.isDark ? '#0a0a0f' : tokens.surface;
  const rowBorder = tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: s.sm,
    },
    identity: {
      flex: 1,
      minWidth: 0,
    },
    activityTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
      letterSpacing: typo.letterSpacing.caption,
    },
    activitySubtitle: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: accentBg,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '500',
      color: tokens.textMuted,
    },
    tabTextActive: {
      color: MARKET_ACCENT,
    },
    warningBanner: {
      marginHorizontal: 16,
      marginBottom: s.xs,
      paddingVertical: s.xs,
      paddingHorizontal: s.sm,
      borderRadius: 8,
      backgroundColor: c.error[50],
      borderWidth: 1,
      borderColor: c.error[200],
    },
    warningBannerText: {
      fontSize: typo.fontSizes.xs,
      color: c.error[700],
      fontWeight: typo.fontWeights.medium,
    },
    listContent: {
      paddingBottom: 120,
    },

    // ── Event row ──
    eventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    eventLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: s.sm,
      minWidth: 0,
    },
    chainBadge: {
      backgroundColor: accentBg,
      borderRadius: 8,
      paddingHorizontal: s.sm,
      paddingVertical: 4,
      marginRight: s.sm,
      maxWidth: 72,
      alignItems: 'center',
    },
    chainBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      fontFamily: typo.fontFamilies.sansBold,
      color: MARKET_ACCENT,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    venueBadge: {
      backgroundColor: accentBg,
      borderRadius: 8,
      paddingHorizontal: s.sm,
      paddingVertical: 4,
      marginRight: s.sm,
      alignSelf: 'flex-start',
      maxWidth: 72,
      alignItems: 'center',
    },
    venueBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      fontFamily: typo.fontFamilies.sansBold,
      color: MARKET_ACCENT,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    exchangeBatchAmount: {
      marginTop: s.xs,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.textStrong,
      textAlign: 'right',
    },
    eventDetails: {
      flex: 1,
      minWidth: 0,
    },
    eventType: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
    },
    eventAddress: {
      fontSize: typo.fontSizes.sm,
      color: tokens.textMuted,
      marginTop: 2,
    },
    summaryLine: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: c.neutral[600],
      textAlign: 'right',
    },
    eventSummaries: {
      marginTop: s.xs,
      alignItems: 'flex-end',
    },
    eventSummaryItem: {
      fontSize: typo.fontSizes.sm,
      color: c.neutral[600],
      marginTop: 2,
      lineHeight: 18,
      textAlign: 'right',
    },
    eventSummaryMore: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      fontStyle: 'italic',
      marginTop: 2,
      textAlign: 'right',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      marginTop: s.xs,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
      borderRadius: tokens.borderRadius.sm,
    },
    statusSuccess: {
      backgroundColor: '#d1fae5',
    },
    statusFailed: {
      backgroundColor: c.error[100],
    },
    statusPending: {
      backgroundColor: c.neutral[200],
    },
    statusBadgeText: {
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.semibold,
      color: c.neutral[700],
    },
    explorerLink: {
      marginTop: s.xs,
      alignSelf: 'flex-start',
    },
    explorerLinkText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      color: c.primary[600],
    },
    eventRight: {
      alignItems: 'flex-end',
      flexShrink: 0,
      minWidth: 100,
    },
    transactionDetails: {
      marginTop: s.sm,
      alignItems: 'flex-end',
    },
    eventCount: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: c.primary[500],
    },
    eventTime: {
      fontSize: typo.fontSizes.xs,
      color: c.neutral[400],
      marginTop: 2,
    },

    // ── Individual transaction row ──
    transactionRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    transactionTitleBlock: {
      flex: 1,
      minWidth: 0,
      marginRight: s.sm,
    },
    transactionMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: s.xs,
    },
    directionBadge: {
      backgroundColor: tokens.inputBg,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      borderRadius: tokens.borderRadius.sm,
      paddingHorizontal: s.sm,
      paddingVertical: s.xs,
    },
    directionBadgeText: {
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.bold,
      color: tokens.textMuted,
      textTransform: 'uppercase',
    },
    transactionAmount: {
      marginTop: s.sm,
      fontSize: typo.fontSizes.lg,
      fontWeight: typo.fontWeights.bold,
      color: tokens.textStrong,
    },
    transactionBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: s.sm,
    },
    transactionStatusBadge: {
      marginTop: 0,
    },
    transactionDetailsBlock: {
      marginTop: s.sm,
      paddingTop: s.sm,
      borderTopWidth: 1,
      borderTopColor: tokens.borderSubtle,
    },
    transactionDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: s.xs,
      minHeight: 20,
    },
    transactionDetailLabel: {
      width: 70,
      fontSize: typo.fontSizes.xs,
      fontWeight: typo.fontWeights.medium,
      color: tokens.textMuted,
    },
    transactionDetailValue: {
      flex: 1,
      minWidth: 0,
      fontSize: typo.fontSizes.sm,
      color: tokens.text,
      textAlign: 'right',
    },
    transactionDetailValueMono: {
      fontFamily: typo.fontFamilies.mono,
      fontSize: typo.fontSizes.xs,
    },
    transactionExplorerLink: {
      marginTop: s.sm,
      alignSelf: 'flex-start',
    },

    // ── Empty state ──
    emptyContainer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
      alignItems: 'flex-start',
    },
    emptyTitle: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      color: tokens.textMuted,
    },
    emptySubtitle: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 4,
      fontFamily: typo.fontFamilies.sans,
    },
  });
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { ProfessionalChart } from '@/src/charts/components/ProfessionalChart';
import { OrderBook } from '@/src/components/OrderBook';
import { NewsCard } from '@/src/components/NewsCard';
import { NewsCardSkeleton } from '@/src/components/NewsCardSkeleton';
import { SaveToBoardModal } from '@/src/components/SaveToBoardModal';
import { CommentTray } from '@/src/components/CommentTray';
import { NewsDetailModal } from '@/src/screens/NewsDetailModal';
import { fetchCoinDetails, fetchCoinStats, fetchCoinNews, toggleReaction } from '@/src/services/api';
import { usePollingEffect } from '@/src/hooks/usePollingEffect';
import { formatMarketCap } from '@/src/utils/format';
import { useAppStore } from '@/src/state/useAppStore';
import type { Coin, CoinStats, NewsItem, ReactionType } from '@/src/types';
import type { KlineInterval } from '@/src/types/kline';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { TradingHeader } from '@/src/screens/trading/TradingHeader';
import { shareNewsById } from '@/src/utils/share';
import { isCoinReturnTo, leaveCoinDetail, navigateToCoin } from '@/src/navigation/coinNavigation';
import { useJumpCorrelationRender } from '@/src/diagnostics/useJumpCorrelationRender';

// ── Interval mapping ──────────────────────────────────────────────────────────
type RangeTab = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y';
const RANGE_TABS: RangeTab[] = ['1H', '1D', '1W', '1M', '3M', '1Y'];
const RANGE_TO_INTERVAL: Record<RangeTab, KlineInterval> = {
  '1H': '1m',
  '1D': '15m',
  '1W': '1h',
  '1M': '4h',
  '3M': '1d',
  '1Y': '1w',
};

// ── Indicator chips ───────────────────────────────────────────────────────────
type Indicator = 'MA' | 'BB' | 'RSI' | 'VOL' | 'MACD';
const INDICATORS: Indicator[] = ['MA', 'BB', 'RSI', 'VOL', 'MACD'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(n: number | undefined): string {
  if (n == null) return '–';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TradingScreen() {
  const { coinId, returnTo } = useLocalSearchParams<{ coinId: string; returnTo?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useAppTheme();
  const S = useMemo(() => buildTradingStyles(tokens), [tokens]);

  // ── Market data state ──
  const [coin, setCoin] = useState<Coin | null>(null);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Chart controls ──
  const [range, setRange] = useState<RangeTab>('1D');
  const [indicators, setIndicators] = useState<Set<Indicator>>(new Set(['MA', 'BB']));
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  // ── News state ──
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [savingNewsId, setSavingNewsId] = useState<string | null>(null);
  const [commentingNewsId, setCommentingNewsId] = useState<string | null>(null);

  useJumpCorrelationRender('TradingScreen', {
    coinId,
    range,
    chartType,
    loading,
    newsLen: news.length,
  });

  // ── App store ──
  const setReaction = useAppStore((state) => state.setReaction);
  const newsReactions = useAppStore((state) => state.newsReactions);
  const boards = useAppStore((state) => state.boards);

  const interval = RANGE_TO_INTERVAL[range];
  const price = coin?.price ?? 0;
  const change = coin?.change24h ?? 0;
  const isUp = change >= 0;

  // ── Initial load ──
  useEffect(() => {
    if (!coinId) return;
    setCoin(null);
    setStats(null);
    setNews([]);
    setError(null);
    setLoading(true);
    setLoadingNews(true);

    let cancelled = false;
    (async () => {
      try {
        const [coinData, statsData] = await Promise.all([
          fetchCoinDetails(coinId),
          fetchCoinStats(coinId).catch(() => null),
        ]);
        if (cancelled) return;
        setCoin(coinData);
        setStats(statsData);
        setLoading(false);

        // Load news after core data is ready
        try {
          const newsData = await fetchCoinNews(coinId);
          if (!cancelled) setNews(newsData);
        } catch {}
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load coin');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingNews(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [coinId]);

  // ── Price refresh every 30s ──
  usePollingEffect(
    async () => {
      if (!coinId) return;
      try {
        const updated = await fetchCoinDetails(coinId);
        setCoin(updated);
      } catch {}
    },
    [coinId],
    { enabled: Boolean(coinId) && !loading, intervalMs: 30_000, immediate: false }
  );

  // ── News with reactions/saves merged from app store ──
  const newsForFeed = useMemo(() => {
    const savedToBoard = (id: string) => boards.some((b) => b.newsIds.includes(id));
    return news.map((item) => ({
      ...item,
      userReaction: newsReactions[item.id] ?? item.userReaction ?? null,
      isSaved: savedToBoard(item.id) || Boolean(item.isSaved),
    }));
  }, [news, newsReactions, boards]);

  // ── News handlers ──
  const openNewsDetailById = useCallback(
    (newsId: string) => {
      const item = newsForFeed.find((n) => n.id === newsId);
      if (!item) return;
      setSelectedNews({
        ...item,
        content:
          item.content ||
          `${item.snippet}\n\nFull article content coming soon.`,
      });
      setIsDetailVisible(true);
    },
    [newsForFeed]
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedNews(null);
  }, []);

  const handleReact = useCallback(
    async (newsId: string, type: ReactionType) => {
      const current = newsReactions[newsId] ?? null;
      const next = current === type ? null : type;
      setReaction(newsId, next);
      setNews((prev) =>
        prev.map((item) => (item.id === newsId ? { ...item, userReaction: next } : item))
      );
      try {
        const result = await toggleReaction(newsId, type);
        setReaction(newsId, result.userReaction);
        setNews((prev) =>
          prev.map((item) =>
            item.id === newsId
              ? { ...item, reactions: result.reactions, userReaction: result.userReaction }
              : item
          )
        );
      } catch {
        setReaction(newsId, current);
        setNews((prev) =>
          prev.map((item) => (item.id === newsId ? { ...item, userReaction: current } : item))
        );
      }
    },
    [newsReactions, setReaction]
  );

  const handleSave = useCallback((newsId: string) => setSavingNewsId(newsId), []);

  const handleSaved = useCallback((newsId: string, saveCount: number) => {
    setNews((prev) =>
      prev.map((item) => (item.id === newsId ? { ...item, isSaved: true, saveCount } : item))
    );
    setSavingNewsId(null);
  }, []);

  const handleComment = useCallback((newsId: string) => setCommentingNewsId(newsId), []);

  const handleCommentCountChange = useCallback((newsId: string, count: number) => {
    setNews((prev) =>
      prev.map((item) => (item.id === newsId ? { ...item, comments: count } : item))
    );
  }, []);

  const handleShare = useCallback((newsId: string) => {
    void shareNewsById(newsId, news);
  }, [news]);

  const handleCoinPress = useCallback(
    (targetCoinId: string) =>
      navigateToCoin(router, targetCoinId, isCoinReturnTo(returnTo) ? returnTo : undefined),
    [router, returnTo]
  );

  const toggleIndicator = useCallback((ind: Indicator) => {
    setIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  // ── Loading / error states ──
  if (loading) {
    return (
      <View style={[S.root, S.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={tokens.chart.line} />
      </View>
    );
  }

  if (error || !coin) {
    return (
      <View style={[S.root, S.center, { paddingTop: insets.top }]}>
        <Text style={S.errorText}>{error ?? 'Coin not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={S.retryBtn}>
          <Text style={S.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const high24h = stats?.high_24h ?? price * 1.02;
  const low24h = stats?.low_24h ?? price * 0.98;
  const volume24h = stats?.total_volume ?? coin.volume24h ?? 0;
  const marketCap = stats?.market_cap ?? coin.marketCap ?? 0;

  return (
    <View style={S.root}>
      <TradingHeader
        coin={coin}
        coinName={coin.name}
        coinSymbol={`${coin.symbol.toUpperCase()} / USDT`}
        tokens={tokens}
        styles={S}
        topInset={insets.top}
        onBack={() => leaveCoinDetail(router, returnTo)}
      />

      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[S.scrollContent, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Price */}
        <View style={S.priceSection}>
          <Text style={S.priceMain}>${fmtPrice(price)}</Text>
          <View style={S.priceRow}>
            <View style={[S.changeBadge, { backgroundColor: isUp ? 'rgba(39,196,133,0.12)' : 'rgba(240,82,82,0.12)' }]}>
              <Text style={[S.changeText, { color: isUp ? tokens.chart.bull : tokens.chart.bear }]}>
                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Range tabs */}
        <View style={S.rangeTabs}>
          {RANGE_TABS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[S.tab, range === r && S.tabActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[S.tabText, range === r && S.tabTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Indicator chips + chart-type toggle */}
        <View style={S.indicatorRow}>
          {INDICATORS.map((ind) => (
            <TouchableOpacity
              key={ind}
              style={[S.chip, indicators.has(ind) && S.chipOn]}
              onPress={() => toggleIndicator(ind)}
            >
              <Text style={[S.chipText, indicators.has(ind) && S.chipTextOn]}>{ind}</Text>
            </TouchableOpacity>
          ))}
          <View style={S.spacer} />
          <TouchableOpacity
            style={[S.typeBtn, chartType === 'candle' && S.typeBtnActive]}
            onPress={() => setChartType('candle')}
          >
            <Text style={[S.typeText, chartType === 'candle' && S.typeTextActive]}>Candle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.typeBtn, chartType === 'line' && S.typeBtnActive]}
            onPress={() => setChartType('line')}
          >
            <Text style={[S.typeText, chartType === 'line' && S.typeTextActive]}>Line</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={S.chartWrapper}>
          <ProfessionalChart symbol={coin.symbol} interval={interval} style={S.chart} />
        </View>

        {/* Stats grid */}
        <View style={S.statsOuter}>
          <View style={S.statsRow}>
            <View style={S.statCell}>
              <Text style={S.statLabel}>24h High</Text>
              <Text style={[S.statValue, { color: tokens.chart.bull }]}>${fmtPrice(high24h)}</Text>
            </View>
            <View style={S.statDivV} />
            <View style={S.statCell}>
              <Text style={S.statLabel}>24h Low</Text>
              <Text style={[S.statValue, { color: tokens.chart.bear }]}>${fmtPrice(low24h)}</Text>
            </View>
          </View>
          <View style={S.statDivH} />
          <View style={S.statsRow}>
            <View style={S.statCell}>
              <Text style={S.statLabel}>24h Volume</Text>
              <Text style={S.statValue}>{formatMarketCap(volume24h)}</Text>
            </View>
            <View style={S.statDivV} />
            <View style={S.statCell}>
              <Text style={S.statLabel}>Market Cap</Text>
              <Text style={S.statValue}>{formatMarketCap(marketCap)}</Text>
            </View>
          </View>
        </View>

        {/* Order book */}
        <View style={S.obSection}>
          <OrderBook basePrice={price} />
        </View>

        {/* Related news */}
        <View style={S.newsSection}>
          <Text style={S.newsTitle}>Related News</Text>
          {loadingNews ? (
            <>
              <NewsCardSkeleton />
              <NewsCardSkeleton />
              <NewsCardSkeleton />
            </>
          ) : newsForFeed.length === 0 ? (
            <Text style={S.emptyNews}>No related news</Text>
          ) : (
            newsForFeed.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onReact={handleReact}
                onComment={handleComment}
                onShare={handleShare}
                onSave={handleSave}
                onCoinPress={handleCoinPress}
                onPress={openNewsDetailById}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* News detail modal */}
      {selectedNews ? (
        <Modal visible={isDetailVisible} animationType="slide" onRequestClose={handleCloseDetail}>
          <NewsDetailModal newsItem={selectedNews} onClose={handleCloseDetail} />
        </Modal>
      ) : null}

      <SaveToBoardModal
        visible={savingNewsId !== null}
        newsId={savingNewsId}
        onClose={() => setSavingNewsId(null)}
        onSaved={handleSaved}
      />

      <CommentTray
        visible={commentingNewsId !== null}
        newsId={commentingNewsId}
        commentCount={
          commentingNewsId
            ? (newsForFeed.find((n) => n.id === commentingNewsId)?.comments ?? 0)
            : 0
        }
        onClose={() => setCommentingNewsId(null)}
        onCountChange={handleCommentCountChange}
      />
    </View>
  );
}

function buildTradingStyles(tokens: ThemeTokens) {
  const accent = tokens.chart.line;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';
  const chipOnBorder = tokens.isDark ? 'rgba(99,131,255,0.4)' : 'rgba(99,131,255,0.45)';
  const chipOnBg = tokens.isDark ? 'rgba(99,131,255,0.1)' : 'rgba(99,131,255,0.08)';
  const subtleFill = tokens.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: subtleFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInfo: { alignItems: 'center' },
  coinName: { fontSize: 14, color: tokens.textMuted },
  coinLabel: { fontSize: 16, fontWeight: '500', color: tokens.text },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {},

  // Price
  priceSection: { paddingHorizontal: 16, paddingBottom: 12 },
  priceMain: { fontSize: 36, fontWeight: '500', color: tokens.text, letterSpacing: -1, lineHeight: 42 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  changeText: { fontSize: 13, fontWeight: '500' },

  // Range tabs
  rangeTabs: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 8 },
  tabActive: { backgroundColor: accentBg },
  tabText: { fontSize: 12, fontWeight: '500', color: tokens.textMuted },
  tabTextActive: { color: accent },

  // Indicator chips
  indicatorRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: tokens.borderStrong,
  },
  chipOn: { borderColor: chipOnBorder, backgroundColor: chipOnBg },
  chipText: { fontSize: 10, color: tokens.textMuted },
  chipTextOn: { color: accent },
  spacer: { flex: 1 },
  typeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: subtleFill,
  },
  typeBtnActive: { backgroundColor: accentBg },
  typeText: { fontSize: 11, color: tokens.textMuted },
  typeTextActive: { color: accent },

  // Chart
  chartWrapper: {
    height: 250,
    marginHorizontal: 16,
    borderRadius: tokens.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: tokens.surfaceMuted,
  },
  chart: { flex: 1 },

  // Stats grid
  statsOuter: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: tokens.borderSubtle,
  },
  statsRow: { flexDirection: 'row' },
  statCell: { flex: 1, backgroundColor: tokens.surfaceMuted, padding: 10 },
  statDivV: { width: 0.5, backgroundColor: tokens.borderSubtle },
  statDivH: { height: 0.5, backgroundColor: tokens.borderSubtle },
  statLabel: { fontSize: 10, color: tokens.textMuted, marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '500', color: tokens.text },

  // Order book
  obSection: { paddingHorizontal: 16, paddingBottom: 16 },

  // News
  newsSection: { paddingTop: 8 },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.text,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  emptyNews: {
    fontSize: 13,
    color: tokens.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },

  // Error state
  errorText: { color: tokens.colors.error[500], fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: accent, fontSize: 14 },
  });
}

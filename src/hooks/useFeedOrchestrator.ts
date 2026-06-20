import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeedFilter, NewsItem } from '@/src/types';
import {
  applyServerRankBoost,
  buildFeedUserContext,
  orchestrateFeed,
  type FeedRankingResult,
  type OrchestratedArticle,
} from '@/src/services/feedOrchestrator';
import { refreshServerFeedRanking } from '@/src/services/feedRankingApi';
import { useAppStore } from '@/src/state/useAppStore';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { useFeedStore } from '@/src/state/useFeedStore';
import { useFeedRiskContext, type FeedRiskContext } from './useFeedRiskContext';
import { fetchPortfolioContextCached } from '@/src/services/piApi';
import { useHasFeature } from '@/src/utils/features';
import { canUsePersonalization } from '@/src/privacy/consentStore';
import { isFeedContextProviderEnabled } from '@/src/config/featureFlags';
import {
  useFeedRiskContextShared,
  useFeedPiContextShared,
  useFeedPersonalizationGate,
  useFeedContextAvailable,
} from '@/src/context/FeedContext';
import { incrementPerfCounter } from '@/src/runtime/perfInstrumentation';

function articleIdsKey(articles: NewsItem[]): string {
  return articles.map((a) => a.id).join('|');
}

function useSharedOrLocalRisk(): FeedRiskContext {
  const feedContextAvailable = useFeedContextAvailable();
  const useShared = isFeedContextProviderEnabled() && feedContextAvailable;
  const shared = useFeedRiskContextShared();
  const local = useFeedRiskContext({ enabled: !useShared });
  if (useShared && shared) return shared;
  return local;
}

function useLegacyPiState(hasPiContext: boolean, personalizationEnabled: boolean) {
  const [heldSymbols, setHeldSymbols] = useState<Set<string>>(new Set());
  const [heldWeightBySymbol, setHeldWeightBySymbol] = useState<Map<string, number>>(new Map());
  const [narrativeVector, setNarrativeVector] = useState<Map<string, number>>(new Map());
  const [convictionVector, setConvictionVector] = useState<Map<string, number>>(new Map());
  const [topThemes, setTopThemes] = useState<string[]>([]);
  const [portfolioAnalyticsRevision, setPortfolioAnalyticsRevision] = useState(0);

  useEffect(() => {
    if (!hasPiContext || !personalizationEnabled) return;
    let cancelled = false;
    fetchPortfolioContextCached().then((ctx) => {
      if (cancelled || !ctx) return;
      setHeldSymbols(new Set(ctx.heldSymbols.map((s) => s.toUpperCase())));
      setHeldWeightBySymbol(
        new Map(Object.entries(ctx.weightBySymbol).map(([k, v]) => [k.toUpperCase(), v]))
      );
      if (ctx.narrativeVector) {
        setNarrativeVector(
          new Map(Object.entries(ctx.narrativeVector).map(([k, v]) => [k.toUpperCase(), v]))
        );
      }
      if (ctx.convictionVector) {
        setConvictionVector(
          new Map(Object.entries(ctx.convictionVector).map(([k, v]) => [k.toUpperCase(), v]))
        );
      }
      setTopThemes(ctx.topThemes ?? []);
      setPortfolioAnalyticsRevision(ctx.analyticsRevision);
    });
    return () => {
      cancelled = true;
    };
  }, [hasPiContext, personalizationEnabled]);

  return {
    heldSymbols,
    heldWeightBySymbol,
    narrativeVector,
    convictionVector,
    topThemes,
    portfolioAnalyticsRevision,
  };
}

export function useFeedOrchestrator(
  rawArticles: NewsItem[],
  mode: FeedFilter
): FeedRankingResult & { articles: OrchestratedArticle[]; isPending: boolean } {
  const followingCoins = useAppStore((s) => s.followingCoins);
  const followingSymbolsFromStore = useAppStore((s) => s.followingSymbols);
  const recentSearchSymbols = useFeedIntentStore((s) => s.recentSearchSymbols);
  const recentReadArticleIds = useFeedIntentStore((s) => s.recentReadArticleIds);
  const riskContext = useSharedOrLocalRisk();
  const setActiveRiskRevision = useFeedStore((s) => s.setActiveRiskRevision);
  const activeRiskRevision = useFeedStore((s) => s.activeRiskRevision);
  const hasPiContext = useHasFeature('portfolio_intelligence_context_api');
  const hasServerFeedRanking = useHasFeature('feed_ranking_server');
  const sharedPi = useFeedPiContextShared();
  const personalizationFromContext = useFeedPersonalizationGate();
  const sharedAvailable = useFeedContextAvailable();
  const useSharedPi = isFeedContextProviderEnabled() && sharedAvailable && sharedPi != null;

  const [debouncedRaw, setDebouncedRaw] = useState(rawArticles);
  const [isPending, setIsPending] = useState(false);
  const [serverScores, setServerScores] = useState<Map<string, number>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadArticlesRef = useRef(rawArticles.length > 0);

  const revisionKey = activeRiskRevision || riskContext.activeRiskRevision;
  const legacyPi = useLegacyPiState(
    hasPiContext && !useSharedPi,
    !useSharedPi && canUsePersonalization()
  );

  const piState = useSharedPi && sharedPi
    ? {
        heldSymbols: sharedPi.pi.heldSymbols,
        heldWeightBySymbol: sharedPi.pi.heldWeightBySymbol,
        narrativeVector: sharedPi.pi.narrativeVector,
        convictionVector: sharedPi.pi.convictionVector,
        topThemes: sharedPi.pi.topThemes,
        portfolioAnalyticsRevision: sharedPi.pi.portfolioAnalyticsRevision,
      }
    : legacyPi;

  const personalizationEnabled = useSharedPi
    ? personalizationFromContext
    : canUsePersonalization();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (rawArticles.length === 0) {
      setDebouncedRaw([]);
      setIsPending(false);
      hadArticlesRef.current = false;
      return;
    }

    const isInitialLoad = !hadArticlesRef.current;
    hadArticlesRef.current = true;

    if (isInitialLoad) {
      setDebouncedRaw(rawArticles);
      setIsPending(false);
      return;
    }

    setIsPending(true);
    debounceRef.current = setTimeout(() => {
      setDebouncedRaw(rawArticles);
      setIsPending(false);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawArticles]);

  useEffect(() => {
    if (!personalizationEnabled || !hasServerFeedRanking || debouncedRaw.length === 0) {
      setServerScores(new Map());
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void refreshServerFeedRanking(debouncedRaw, mode).then((scores) => {
        if (!cancelled) setServerScores(scores);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [debouncedRaw, mode, personalizationEnabled, hasServerFeedRanking]);

  useEffect(() => {
    if (riskContext.activeRiskRevision > 0) {
      setActiveRiskRevision(riskContext.activeRiskRevision);
    }
  }, [riskContext.activeRiskRevision, setActiveRiskRevision]);

  const followingCoinIds = useMemo(() => new Set(followingCoins), [followingCoins]);

  const followingSymbols = useMemo(() => {
    const symbols = new Set<string>();
    for (const sym of followingSymbolsFromStore) {
      if (sym) symbols.add(sym.toUpperCase());
    }
    for (const id of followingCoins) {
      symbols.add(id.toUpperCase());
    }
    return symbols;
  }, [followingCoins, followingSymbolsFromStore]);

  const crsKey = riskContext.crsBySymbol.size;
  const deltaKey = riskContext.crsDeltaBySymbol.size;
  const shockKey = riskContext.sentimentShockSymbols.size;
  const moversKey = riskContext.moversTopRiskSymbols.size;

  const context = useMemo(
    () =>
      buildFeedUserContext({
        mode,
        followingCoinIds,
        followingSymbols,
        recentSearchSymbols,
        recentReadArticleIds: new Set(recentReadArticleIds),
        activeRiskRevision: revisionKey,
        crsBySymbol: riskContext.crsBySymbol,
        crsDeltaBySymbol: riskContext.crsDeltaBySymbol,
        sentimentShockSymbols: riskContext.sentimentShockSymbols,
        moversTopRiskSymbols: riskContext.moversTopRiskSymbols,
        marketRegime: riskContext.marketRegime,
        riskStale: riskContext.riskStale,
        heldSymbols: piState.heldSymbols,
        heldWeightBySymbol: piState.heldWeightBySymbol,
        portfolioAnalyticsRevision: piState.portfolioAnalyticsRevision,
        narrativeVector:
          piState.narrativeVector.size > 0 ? piState.narrativeVector : undefined,
        convictionVector:
          piState.convictionVector.size > 0 ? piState.convictionVector : undefined,
        topThemes: piState.topThemes.length > 0 ? piState.topThemes : undefined,
      }),
    [
      mode,
      followingCoinIds,
      followingSymbols,
      recentSearchSymbols,
      recentReadArticleIds,
      revisionKey,
      crsKey,
      deltaKey,
      shockKey,
      moversKey,
      riskContext.marketRegime,
      riskContext.riskStale,
      piState.heldSymbols,
      piState.heldWeightBySymbol,
      piState.narrativeVector,
      piState.convictionVector,
      piState.topThemes,
      piState.portfolioAnalyticsRevision,
    ]
  );

  const idsKey = articleIdsKey(debouncedRaw);

  const result = useMemo(() => {
    incrementPerfCounter('feedOrchestration');
    if (debouncedRaw.length === 0) {
      return { articles: [], removedCount: 0, suppressedCount: 0 };
    }
    const orchestrated = !personalizationEnabled
      ? orchestrateFeed(debouncedRaw, mode, {
          ...context,
          recentSearchSymbols: [],
          recentReadArticleIds: new Set(),
          heldSymbols: new Set(),
          heldWeightBySymbol: new Map(),
          narrativeVector: undefined,
          convictionVector: undefined,
          topThemes: [],
        })
      : orchestrateFeed(debouncedRaw, mode, context);
    const articles = applyServerRankBoost(orchestrated.articles, serverScores);
    return { ...orchestrated, articles };
  }, [debouncedRaw, mode, context, idsKey, personalizationEnabled, serverScores]);

  return { ...result, isPending };
}

export function orchestrateArticlesNow(
  articles: NewsItem[],
  mode: FeedFilter,
  options?: {
    followingCoins?: string[];
    recentSearchSymbols?: string[];
    riskContext?: FeedRiskContext;
  }
): OrchestratedArticle[] {
  const following = options?.followingCoins ?? useAppStore.getState().followingCoins;
  const searches =
    options?.recentSearchSymbols ?? useFeedIntentStore.getState().recentSearchSymbols;
  const risk = options?.riskContext;

  const ctx = buildFeedUserContext({
    mode,
    followingCoinIds: new Set(following),
    followingSymbols: new Set(following.map((id) => id.toUpperCase())),
    recentSearchSymbols: searches,
    recentReadArticleIds: new Set(useFeedIntentStore.getState().recentReadArticleIds),
    activeRiskRevision: risk?.activeRiskRevision ?? 0,
    crsBySymbol: risk?.crsBySymbol ?? new Map(),
    crsDeltaBySymbol: risk?.crsDeltaBySymbol ?? new Map(),
    sentimentShockSymbols: risk?.sentimentShockSymbols ?? new Set(),
    moversTopRiskSymbols: risk?.moversTopRiskSymbols ?? new Set(),
    marketRegime: risk?.marketRegime ?? null,
    riskStale: risk?.riskStale ?? true,
    heldSymbols: new Set<string>(),
    heldWeightBySymbol: new Map<string, number>(),
    portfolioAnalyticsRevision: 0,
  });

  return orchestrateFeed(articles, mode, ctx).articles;
}

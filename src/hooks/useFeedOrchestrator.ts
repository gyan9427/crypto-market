import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeedFilter, NewsItem } from '@/src/types';
import {
  buildFeedUserContext,
  orchestrateFeed,
  type FeedRankingResult,
  type OrchestratedArticle,
} from '@/src/services/feedOrchestrator';
import { useAppStore } from '@/src/state/useAppStore';
import { useFeedIntentStore } from '@/src/state/useFeedIntentStore';
import { useFeedStore } from '@/src/state/useFeedStore';
import { useFeedRiskContext } from './useFeedRiskContext';
import { fetchPortfolioContextCached } from '@/src/services/piApi';
import { useHasFeature } from '@/src/utils/features';

function articleIdsKey(articles: NewsItem[]): string {
  return articles.map((a) => a.id).join('|');
}

export function useFeedOrchestrator(
  rawArticles: NewsItem[],
  mode: FeedFilter
): FeedRankingResult & { articles: OrchestratedArticle[] } {
  const followingCoins = useAppStore((s) => s.followingCoins);
  const recentSearchSymbols = useFeedIntentStore((s) => s.recentSearchSymbols);
  const recentReadArticleIds = useFeedIntentStore((s) => s.recentReadArticleIds);
  const riskContext = useFeedRiskContext();
  const setActiveRiskRevision = useFeedStore((s) => s.setActiveRiskRevision);
  const activeRiskRevision = useFeedStore((s) => s.activeRiskRevision);

  const [debouncedRaw, setDebouncedRaw] = useState(rawArticles);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heldSymbols, setHeldSymbols] = useState<Set<string>>(new Set());
  const [heldWeightBySymbol, setHeldWeightBySymbol] = useState<Map<string, number>>(new Map());
  const [narrativeVector, setNarrativeVector] = useState<Map<string, number>>(new Map());
  const [convictionVector, setConvictionVector] = useState<Map<string, number>>(new Map());
  const [topThemes, setTopThemes] = useState<string[]>([]);
  const [portfolioAnalyticsRevision, setPortfolioAnalyticsRevision] = useState(0);
  const hasPiContext = useHasFeature('portfolio_intelligence_context_api');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedRaw(rawArticles);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawArticles]);

  useEffect(() => {
    if (riskContext.activeRiskRevision > 0) {
      setActiveRiskRevision(riskContext.activeRiskRevision);
    }
  }, [riskContext.activeRiskRevision, setActiveRiskRevision]);

  const followingCoinIds = useMemo(() => new Set(followingCoins), [followingCoins]);

  const followingSymbols = useMemo(() => {
    const symbols = new Set<string>();
    for (const id of followingCoins) {
      symbols.add(id.toUpperCase());
    }
    return symbols;
  }, [followingCoins]);

  const revisionKey = activeRiskRevision || riskContext.activeRiskRevision;

  useEffect(() => {
    if (!hasPiContext) return;
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
  }, [hasPiContext, revisionKey, portfolioAnalyticsRevision]);
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
        heldSymbols,
        heldWeightBySymbol,
        portfolioAnalyticsRevision,
        narrativeVector:
          narrativeVector.size > 0 ? narrativeVector : undefined,
        convictionVector:
          convictionVector.size > 0 ? convictionVector : undefined,
        topThemes: topThemes.length > 0 ? topThemes : undefined,
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
      riskContext.crsBySymbol,
      riskContext.crsDeltaBySymbol,
      riskContext.sentimentShockSymbols,
      riskContext.moversTopRiskSymbols,
      heldSymbols,
      heldWeightBySymbol,
      narrativeVector,
      convictionVector,
      topThemes,
      portfolioAnalyticsRevision,
    ]
  );

  const idsKey = articleIdsKey(debouncedRaw);

  const result = useMemo(() => {
    if (debouncedRaw.length === 0) {
      return { articles: [], removedCount: 0, suppressedCount: 0 };
    }
    return orchestrateFeed(debouncedRaw, mode, context);
  }, [debouncedRaw, mode, context, idsKey]);

  return result;
}

export function orchestrateArticlesNow(
  articles: NewsItem[],
  mode: FeedFilter,
  options?: {
    followingCoins?: string[];
    recentSearchSymbols?: string[];
    riskContext?: ReturnType<typeof useFeedRiskContext>;
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

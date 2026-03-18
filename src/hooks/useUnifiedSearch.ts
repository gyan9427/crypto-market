import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchSegment, UnifiedSearchResult, unifiedSearch } from '../services/api';

type UseUnifiedSearchOptions = {
  segments?: SearchSegment[];
  minQueryLength?: number;
  debounceMs?: number;
  limit?: number;
  enabled?: boolean;
};

const CACHE_TTL_MS = 20_000;
const inMemoryCache = new Map<string, { expiresAt: number; value: UnifiedSearchResult }>();

const emptyResult = (segments: SearchSegment[]): UnifiedSearchResult => ({
  coins: [],
  news: [],
  users: [],
  newsBoards: [],
  portfolioAssets: [],
  meta: {
    tookMs: 0,
    query: '',
    segments,
    partialFailures: [],
  },
});

const normalizeSegments = (segments?: SearchSegment[]): SearchSegment[] => {
  if (!segments || segments.length === 0) return ['all'];
  const unique = new Set<SearchSegment>();
  for (const segment of segments) {
    if (!segment) continue;
    if (segment === 'all') return ['all'];
    unique.add(segment);
  }
  return unique.size > 0 ? Array.from(unique) : ['all'];
};

const cacheKey = (query: string, segments: SearchSegment[], limit: number): string =>
  `${query.trim().toLowerCase()}|${segments.join(',')}|${limit}`;

const readCache = (key: string): UnifiedSearchResult | null => {
  const row = inMemoryCache.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    inMemoryCache.delete(key);
    return null;
  }
  return row.value;
};

const writeCache = (key: string, value: UnifiedSearchResult): void => {
  if (inMemoryCache.size > 200) {
    const firstKey = inMemoryCache.keys().next().value;
    if (firstKey) inMemoryCache.delete(firstKey);
  }
  inMemoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

export function useUnifiedSearch(query: string, options: UseUnifiedSearchOptions = {}) {
  const segments = useMemo(() => normalizeSegments(options.segments), [options.segments]);
  const segmentsKey = useMemo(() => segments.join(','), [segments]);
  const limit = options.limit ?? 8;
  const minQueryLength = options.minQueryLength ?? 2;
  const debounceMs = options.debounceMs ?? 300;
  const enabled = options.enabled ?? true;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedSearchResult>(() => emptyResult(segments));
  const latestRequestRef = useRef(0);

  useEffect(() => {
    setResult(emptyResult(segments));
  }, [segments, segmentsKey]);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = query.trim();

    if (trimmed.length < minQueryLength) {
      setLoading(false);
      setError(null);
      setResult(emptyResult(segments));
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    const controller = new AbortController();

    const run = async () => {
      const key = cacheKey(trimmed, segments, limit);
      const cached = readCache(key);
      if (cached) {
        setResult(cached);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await unifiedSearch(trimmed, {
          segments,
          limit,
          signal: controller.signal,
        });
        if (latestRequestRef.current !== requestId) return;
        writeCache(key, response);
        setResult(response);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        if (latestRequestRef.current !== requestId) return;
        setResult(emptyResult(segments));
        setError(err?.message || 'Search failed');
      } finally {
        if (latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(run, debounceMs);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, segments, segmentsKey, limit, minQueryLength, debounceMs, enabled]);

  return {
    query,
    loading,
    error,
    result,
    isActive: enabled && query.trim().length >= minQueryLength,
  };
}

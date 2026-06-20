import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'feed_intent_v1';
const MAX_SEARCH_SYMBOLS = 8;
const MAX_READ_IDS = 30;
const SEARCH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SearchEntry = { symbol: string; at: number };

type PersistedPayload = {
  searches: SearchEntry[];
  readIds: string[];
  dwellBuckets?: Record<string, number>;
};

type FeedIntentState = {
  recentSearchSymbols: string[];
  recentReadArticleIds: string[];
  dwellTimeBuckets: Record<string, number>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  recordSearchCoin: (symbol: string) => void;
  recordArticleRead: (articleId: string) => void;
  recordArticleDwell: (articleId: string, seconds: number) => void;
  clearAll: () => Promise<void>;
};

function pruneSearches(entries: SearchEntry[]): SearchEntry[] {
  const now = Date.now();
  const fresh = entries.filter((e) => now - e.at < SEARCH_TTL_MS);
  const seen = new Set<string>();
  const out: SearchEntry[] = [];
  for (const e of fresh) {
    const sym = e.symbol.toUpperCase();
    if (seen.has(sym)) continue;
    seen.add(sym);
    out.push({ symbol: sym, at: e.at });
    if (out.length >= MAX_SEARCH_SYMBOLS) break;
  }
  return out;
}

async function loadPersisted(): Promise<PersistedPayload> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { searches: [], readIds: [] };
    const parsed = JSON.parse(raw) as PersistedPayload;
    return {
      searches: pruneSearches(parsed.searches ?? []),
      readIds: (parsed.readIds ?? []).slice(0, MAX_READ_IDS),
      dwellBuckets: parsed.dwellBuckets ?? {},
    };
  } catch {
    return { searches: [], readIds: [] };
  }
}

async function savePersisted(payload: PersistedPayload): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // non-fatal
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(getState: () => FeedIntentState): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const s = getState();
    const payload: PersistedPayload = {
      searches: s.recentSearchSymbols.map((symbol) => ({
        symbol,
        at: Date.now(),
      })),
      readIds: s.recentReadArticleIds,
      dwellBuckets: s.dwellTimeBuckets,
    };
    void savePersisted(payload);
  }, 400);
}

export const useFeedIntentStore = create<FeedIntentState>((set, get) => ({
  recentSearchSymbols: [],
  recentReadArticleIds: [],
  dwellTimeBuckets: {},
  hydrated: false,

  hydrate: async () => {
    const data = await loadPersisted();
    set({
      recentSearchSymbols: data.searches.map((e) => e.symbol),
      recentReadArticleIds: data.readIds,
      dwellTimeBuckets: data.dwellBuckets ?? {},
      hydrated: true,
    });
  },

  recordSearchCoin: (symbol: string) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    const prev = get().recentSearchSymbols.filter((s) => s !== sym);
    const next = [sym, ...prev].slice(0, MAX_SEARCH_SYMBOLS);
    set({ recentSearchSymbols: next });
    schedulePersist(get);
  },

  recordArticleRead: (articleId: string) => {
    const id = articleId.trim();
    if (!id) return;
    const prev = get().recentReadArticleIds.filter((r) => r !== id);
    const next = [id, ...prev].slice(0, MAX_READ_IDS);
    set({ recentReadArticleIds: next });
    schedulePersist(get);
  },

  recordArticleDwell: (articleId: string, seconds: number) => {
    const id = articleId.trim();
    if (!id || seconds <= 0) return;
    const bucket = seconds < 30 ? 'skim' : seconds < 120 ? 'read' : 'deep';
    const prev = get().dwellTimeBuckets;
    set({ dwellTimeBuckets: { ...prev, [bucket]: (prev[bucket] ?? 0) + 1 } });
    schedulePersist(get);
  },

  clearAll: async () => {
    set({ recentSearchSymbols: [], recentReadArticleIds: [], dwellTimeBuckets: {} });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

import { Coin, CoinStats, NewsItem, TrendingCoin, User, NewsBoard, Comment, ReactionType, ReactionCounts } from '../types';
import type { SupportedLanguage } from '@/src/constants/languages';
import { isSupportedLanguage } from '@/src/constants/languages';
import { useAuthStore } from '../state/useAuthStore';
import { getApiLocaleLanguage } from '@/src/services/apiLocale';
import { resolveApiBaseUrl } from '../config/apiBaseUrl';
import { fetchJsonCached } from './requestCache';

export const API_BASE_URL = resolveApiBaseUrl();

// Backend response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Backend types
interface BackendNewsCategory {
  key: string;
  name: string;
}

interface BackendNews {
  id: string;
  title: string;
  summary: string;
  subtitle?: string;
  source: string;
  url: string;
  sourceUrl?: string;
  image?: string;
  relatedCoins: string[];
  categories?: BackendNewsCategory[];
  publishedAt: string | Date;
  saveCount?: number;
  comments?: number;
  reactions?: ReactionCounts;
  userReaction?: ReactionType | null;
}

interface BackendCoin {
  coinId: string;
  symbol: string;
  name: string;
  rank: number;
  price: number;
  percentChange24h: number;
  marketCap?: number;
  volume24h?: number;
  image?: string;
}

interface BackendUser {
  _id: string;
  email: string;
  username: string;
  followingCoins?: string[];
  rewardPoints?: number;
  preferredLanguage?: string | null;
  createdAt?: string;
}

interface BackendFollowUser {
  id: string;
  username: string;
  followedAt?: string;
  followersCount?: number;
}

interface FollowStats {
  followersCount: number;
  followingUsersCount?: number;
  followingCoinsCount?: number;
}

export type SearchSegment =
  | 'all'
  | 'coins'
  | 'news'
  | 'users'
  | 'newsBoards'
  | 'portfolioAssets';

export type SearchSegmentRunStatus = 'ok' | 'empty' | 'timeout' | 'error';

export type SearchSegmentKey = Exclude<SearchSegment, 'all'>;

export interface SearchMeta {
  tookMs: number;
  query: string;
  segments: SearchSegment[];
  partialFailures?: string[];
  nextCursor?: string;
  segmentStatus?: Partial<Record<SearchSegmentKey, SearchSegmentRunStatus>>;
  segmentTookMs?: Partial<Record<SearchSegmentKey, number>>;
  cacheHit?: boolean;
  degraded?: boolean;
}

export interface SearchBoardResult {
  id: string;
  name: string;
  newsIds?: string[];
  itemCount?: number;
}

export interface SearchPortfolioAssetResult {
  id: string;
  symbol: string;
  name: string;
  balance?: number;
  valueUsd?: number;
  chain?: string;
}

export interface UnifiedSearchResult {
  coins: Coin[];
  news: NewsItem[];
  users: { id: string; username: string }[];
  newsBoards: SearchBoardResult[];
  portfolioAssets: SearchPortfolioAssetResult[];
  meta: SearchMeta;
}

export interface UnifiedSearchOptions {
  segments?: SearchSegment[];
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': getApiLocaleLanguage(),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Network request failed') {
      throw new Error(
        'Network request failed. Check EXPO_PUBLIC_API_BASE_URL: use https or your PC LAN IP (not localhost on a phone). ' +
          'For http:// on Android you need a dev build with usesCleartextTraffic (see app.json); Expo Go may still block some http targets.'
      );
    }
    throw err instanceof Error ? err : new Error(msg);
  }

  let data: ApiResponse<T>;
  try {
    const text = await response.text();
    data = text ? (JSON.parse(text) as ApiResponse<T>) : ({} as ApiResponse<T>);
  } catch {
    throw new Error(`Invalid response from server (HTTP ${response.status})`);
  }

  if (!response.ok || !data.success) {
    // Handle 401 unauthorized
    if (response.status === 401) {
      await useAuthStore.getState().logout();
      const { useAppStore } = await import('../state/useAppStore');
      useAppStore.getState().setFeedFilter('explore');
      throw new Error('Unauthorized. Please login again.');
    }
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data.data as T;
}

// Data transformation functions
function transformBackendNews(backendNews: BackendNews, coins: Coin[] = []): NewsItem {
  const publishedAt = typeof backendNews.publishedAt === 'string' 
    ? new Date(backendNews.publishedAt) 
    : backendNews.publishedAt;

  // Map relatedCoins strings to full Coin objects
  const relatedCoins: Coin[] = backendNews.relatedCoins
    .map((coinId) => coins.find((c) => c.id === coinId))
    .filter((coin): coin is Coin => coin !== undefined);

  const sourceUrl = backendNews.sourceUrl || backendNews.url;
  const description = backendNews.subtitle || backendNews.summary;

  const defaultReactions: ReactionCounts = {
    appreciate: 0, insightful: 0, bullish: 0,
    risk: 0, deepDive: 0, debatable: 0, total: 0,
  };

  return {
    id: backendNews.id,
    title: backendNews.title,
    snippet: description,
    content: description,
    subtitle: description,
    imageUrl: backendNews.image,
    source: backendNews.source,
    sourceUrl,
    publishedAt,
    coins: relatedCoins,
    relatedCoins: backendNews.relatedCoins || [],
    categories: backendNews.categories || [],
    likes: backendNews.reactions?.total ?? 0,
    comments: backendNews.comments ?? 0,
    shares: 0,
    saveCount: backendNews.saveCount ?? 0,
    url: sourceUrl,
    isLiked: false,
    isSaved: false,
    reactions: backendNews.reactions ?? defaultReactions,
    userReaction: backendNews.userReaction ?? null,
  };
}

function transformBackendCoin(backendCoin: BackendCoin, isFollowing: boolean = false): Coin {
  return {
    id: backendCoin.coinId,
    symbol: backendCoin.symbol,
    name: backendCoin.name,
    price: backendCoin.price,
    change24h: backendCoin.percentChange24h,
    marketCap: backendCoin.marketCap,
    volume24h: backendCoin.volume24h,
    logo: backendCoin.image,
    isFollowing,
    sparklineData: undefined, // Backend doesn't provide sparkline data
  };
}

function transformBackendTrendingCoin(
  backendCoin: BackendCoin,
  category: 'trending' | 'top' = 'trending',
  isFollowing: boolean = false
): TrendingCoin {
  return {
    ...transformBackendCoin(backendCoin, isFollowing),
    rank: backendCoin.rank,
    category,
  };
}

function transformBackendUser(backendUser: BackendUser): User {
  const pl = backendUser.preferredLanguage;
  const user: User = {
    id: backendUser._id,
    name: backendUser.username, // Backend doesn't have separate name field
    username: backendUser.username,
    verified: false, // Backend doesn't track verification
  };
  if (pl != null && pl !== '' && isSupportedLanguage(pl)) {
    user.preferredLanguage = pl;
  }
  return user;
}

// API Functions

/**
 * Fetch news articles from API
 */
export const fetchCoinsByIds = async (coinIds: string[]): Promise<Coin[]> => {
  const unique = [...new Set(coinIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, 50);
  if (unique.length === 0) return [];

  let followingIds: Set<string> = new Set();
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const wishlist = await getWishlist();
      followingIds = new Set(wishlist.map((c) => c.id));
    } catch {
      followingIds = new Set();
    }
  }

  const response = await apiRequest<{ coins: BackendCoin[] }>(
    `/coins/batch?ids=${encodeURIComponent(unique.join(','))}`
  );
  return response.coins.map((c) => transformBackendCoin(c, followingIds.has(c.coinId)));
};

export const fetchNews = async (
  filter: 'following' | 'explore',
  page: number = 1,
  limit: number = 50,
  categories?: string[],
  mode: 'all' | 'coin' | 'users' = 'all'
): Promise<NewsItem[]> => {
  try {
    // Backend `/news/following` requires auth; avoid 401 when logged out or token cleared.
    const resolvedFilter: 'following' | 'explore' =
      filter === 'following' && !useAuthStore.getState().isAuthenticated ? 'explore' : filter;

    const categoryParam =
      categories && categories.length
        ? `&categories=${encodeURIComponent(categories.join(','))}`
        : '';
    const modeParam = resolvedFilter === 'following' ? `&mode=${encodeURIComponent(mode)}` : '';

    const endpoint =
      resolvedFilter === 'following'
        ? `/news/following?page=${page}&limit=${limit}${categoryParam}${modeParam}`
        : `/news?page=${page}&limit=${limit}${categoryParam}`;
    
    const response = await apiRequest<{ news: BackendNews[] }>(endpoint);
    
    const coinIds = new Set<string>();
    response.news.forEach((news) => {
      news.relatedCoins.forEach((coinId) => coinIds.add(coinId));
    });

    const coinIdArray = Array.from(coinIds).slice(0, 50);
    let coins: Coin[] = [];
    if (coinIdArray.length > 0) {
      try {
        coins = await fetchCoinsByIds(coinIdArray);
      } catch (e) {
        console.warn('fetchCoinsByIds failed:', e);
      }
    }

    return response.news.map((news) => transformBackendNews(news, coins));
  } catch (error: any) {
    throw new Error(`Failed to fetch news: ${error.message}`);
  }
};

/**
 * Fetch trending coins from API
 */
export const fetchTrendingCoins = async (
  category?: 'trending' | 'top'
): Promise<TrendingCoin[]> => {
  try {
    let endpoint = '/market/trending';

    if (category === 'top') {
      endpoint = '/market/trending'; // Use trending for now, or could use top-gainers
    }

    const response = await apiRequest<{ coins: BackendCoin[] }>(endpoint);
    
    // Get user's following coins if authenticated
    const followingCoins: string[] = [];
    if (useAuthStore.getState().isAuthenticated) {
      try {
        const wishlist = await getWishlist();
        followingCoins.push(...wishlist.map((coin) => coin.id));
      } catch (error) {
        // Ignore errors fetching wishlist
      }
    }

    return response.coins.map((coin) =>
      transformBackendTrendingCoin(
        coin,
        category || 'trending',
        followingCoins.includes(coin.coinId)
      )
    );
  } catch (error: any) {
    throw new Error(`Failed to fetch trending coins: ${error.message}`);
  }
};

/**
 * Fetch coin details by ID
 */
export const fetchCoinDetails = async (coinId: string): Promise<Coin> => {
  try {
    const response = await apiRequest<{ coin: BackendCoin }>(`/coins/${coinId}`);
    
    // Check if user is following this coin
    let isFollowing = false;
    if (useAuthStore.getState().isAuthenticated) {
      try {
        const wishlist = await getWishlist();
        isFollowing = wishlist.some((coin) => coin.id === coinId);
      } catch (error) {
        // Ignore errors
      }
    }

    return transformBackendCoin(response.coin, isFollowing);
  } catch (error: any) {
    throw new Error(`Failed to fetch coin details: ${error.message}`);
  }
};

/**
 * Fetch news articles related to a coin
 */
export const fetchCoinNews = async (coinId: string): Promise<NewsItem[]> => {
  try {
    const response = await apiRequest<{ news: BackendNews[] }>(`/coins/${coinId}/news`);
    return response.news.map((news) => transformBackendNews(news, []));
  } catch (error: any) {
    throw new Error(`Failed to fetch coin news: ${error.message}`);
  }
};

/**
 * Fetch coin stats from labeled_active_coins (market cap, rank, supply, contract address)
 */
export const fetchCoinStats = async (coinId: string): Promise<CoinStats | null> => {
  try {
    const response = await apiRequest<{ stats: CoinStats }>(`/coins/${coinId}/stats`);
    return response.stats;
  } catch {
    return null;
  }
};

/**
 * Fetch news article by ID
 */
export const fetchNewsDetails = async (newsId: string): Promise<NewsItem> => {
  try {
    const response = await apiRequest<{ news: BackendNews }>(`/news/${newsId}`);

    const ids = response.news.relatedCoins.slice(0, 50);
    let coins: Coin[] = [];
    if (ids.length > 0) {
      try {
        coins = await fetchCoinsByIds(ids);
      } catch (error) {
        console.warn('fetchCoinsByIds in fetchNewsDetails:', error);
      }
    }

    return transformBackendNews(response.news, coins);
  } catch (error: any) {
    throw new Error(`Failed to fetch news details: ${error.message}`);
  }
};

/**
 * Toggle a reaction on a news article. Returns the updated reaction state.
 */
export const toggleReaction = async (
  newsId: string,
  type: ReactionType
): Promise<{ userReaction: ReactionType | null; reactions: ReactionCounts }> => {
  return apiRequest<{ userReaction: ReactionType | null; reactions: ReactionCounts }>(
    `/news/${newsId}/reactions`,
    {
      method: 'PUT',
      body: JSON.stringify({ type }),
    }
  );
};

/**
 * Remove the current user's reaction from a news article.
 */
export const removeReaction = async (
  newsId: string
): Promise<{ userReaction: null; reactions: ReactionCounts }> => {
  return apiRequest<{ userReaction: null; reactions: ReactionCounts }>(
    `/news/${newsId}/reactions`,
    { method: 'DELETE' }
  );
};

/**
 * Get user's news boards
 */
export const getNewsBoards = async (): Promise<NewsBoard[]> => {
  try {
    const response = await apiRequest<{ boards: Array<{ id: string; name: string; newsIds: string[]; createdAt: string }> }>('/newsboards');
    return response.boards.map((b) => ({
      id: b.id,
      name: b.name,
      newsIds: b.newsIds,
      createdAt: b.createdAt,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch news boards: ${error.message}`);
  }
};

/**
 * Create a new news board
 */
export const createNewsBoard = async (name: string): Promise<NewsBoard> => {
  try {
    const response = await apiRequest<{ board: { id: string; name: string; newsIds: string[]; createdAt: string } }>('/newsboards', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return {
      id: response.board.id,
      name: response.board.name,
      newsIds: response.board.newsIds,
      createdAt: response.board.createdAt,
    };
  } catch (error: any) {
    throw new Error(`Failed to create news board: ${error.message}`);
  }
};

/**
 * Save a news article to a board — increments global save count on first save
 */
export const saveNewsToBoard = async (
  newsId: string,
  boardId: string
): Promise<{ saveCount: number; boardId: string }> => {
  try {
    const response = await apiRequest<{ saveCount: number; boardId: string }>(
      `/newsboards/${boardId}/items`,
      {
        method: 'POST',
        body: JSON.stringify({ newsId }),
      }
    );
    return response;
  } catch (error: any) {
    throw new Error(`Failed to save news to board: ${error.message}`);
  }
};

/**
 * Remove a news article from a board — decrements global save count if last board
 */
export const unsaveNewsFromBoard = async (
  newsId: string,
  boardId: string
): Promise<{ saveCount: number }> => {
  try {
    const response = await apiRequest<{ saveCount: number }>(
      `/newsboards/${boardId}/items/${newsId}`,
      { method: 'DELETE' }
    );
    return response;
  } catch (error: any) {
    throw new Error(`Failed to unsave news from board: ${error.message}`);
  }
};

/**
 * Follow a coin (add to wishlist)
 */
export const followCoin = async (coinId: string): Promise<void> => {
  try {
    await apiRequest(`/follow/coins/${coinId}`, { method: 'POST' });
  } catch (error: any) {
    if (String(error?.message || '').includes('404')) {
      await apiRequest(`/wishlist/${coinId}`, { method: 'POST' });
      return;
    }
    throw new Error(`Failed to follow coin: ${error.message}`);
  }
};

/**
 * Unfollow a coin (remove from wishlist)
 */
export const unfollowCoin = async (coinId: string): Promise<void> => {
  try {
    await apiRequest(`/follow/coins/${coinId}`, { method: 'DELETE' });
  } catch (error: any) {
    if (String(error?.message || '').includes('404')) {
      await apiRequest(`/wishlist/${coinId}`, { method: 'DELETE' });
      return;
    }
    throw new Error(`Failed to unfollow coin: ${error.message}`);
  }
};

/**
 * Get wishlist (following coins)
 */
export const getWishlist = async (): Promise<Coin[]> => {
  return getFollowedCoins();
};

export const getFollowedCoins = async (): Promise<Coin[]> => {
  try {
    const response = await apiRequest<{ coins: BackendCoin[] }>('/follow/coins');
    return response.coins.map((coin) => transformBackendCoin(coin, true));
  } catch (error: any) {
    if (String(error?.message || '').includes('404')) {
      const fallback = await apiRequest<{ coins: BackendCoin[] }>('/wishlist');
      return fallback.coins.map((coin) => transformBackendCoin(coin, true));
    }
    throw new Error(`Failed to fetch followed coins: ${error.message}`);
  }
};

export const followUser = async (userId: string): Promise<void> => {
  try {
    await apiRequest(`/follow/users/${userId}`, { method: 'POST' });
  } catch (error: any) {
    throw new Error(`Failed to follow user: ${error.message}`);
  }
};

export const unfollowUser = async (userId: string): Promise<void> => {
  try {
    await apiRequest(`/follow/users/${userId}`, { method: 'DELETE' });
  } catch (error: any) {
    throw new Error(`Failed to unfollow user: ${error.message}`);
  }
};

export const getFollowedUsers = async (): Promise<BackendFollowUser[]> => {
  try {
    const response = await apiRequest<{ users: BackendFollowUser[] }>('/follow/users');
    return response.users;
  } catch (error: any) {
    throw new Error(`Failed to fetch followed users: ${error.message}`);
  }
};

export const getUserFollowers = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<BackendFollowUser[]> => {
  try {
    const response = await apiRequest<{ followers: BackendFollowUser[] }>(
      `/follow/users/${userId}/followers?page=${page}&limit=${limit}`
    );
    return response.followers;
  } catch (error: any) {
    throw new Error(`Failed to fetch user followers: ${error.message}`);
  }
};

export const getCoinFollowers = async (
  coinId: string,
  page: number = 1,
  limit: number = 20
): Promise<BackendFollowUser[]> => {
  try {
    const response = await apiRequest<{ followers: BackendFollowUser[] }>(
      `/follow/coins/${coinId}/followers?page=${page}&limit=${limit}`
    );
    return response.followers;
  } catch (error: any) {
    throw new Error(`Failed to fetch coin followers: ${error.message}`);
  }
};

export const getUserFollowStats = async (userId: string): Promise<FollowStats> => {
  try {
    return await apiRequest<FollowStats>(`/follow/users/${userId}/stats`);
  } catch (error: any) {
    throw new Error(`Failed to fetch user follow stats: ${error.message}`);
  }
};

export const getCoinFollowStats = async (coinId: string): Promise<FollowStats> => {
  try {
    return await apiRequest<FollowStats>(`/follow/coins/${coinId}/stats`);
  } catch (error: any) {
    throw new Error(`Failed to fetch coin follow stats: ${error.message}`);
  }
};

/**
 * Search coins and news
 */
export const search = async (query: string): Promise<{ coins: Coin[]; news: NewsItem[] }> => {
  try {
    const result = await unifiedSearch(query, { segments: ['coins', 'news'] });
    return { coins: result.coins, news: result.news };
  } catch (error: any) {
    throw new Error(`Failed to search: ${error.message}`);
  }
};

const DEFAULT_SEARCH_META: SearchMeta = {
  tookMs: 0,
  query: '',
  segments: ['all'],
  partialFailures: [],
  segmentStatus: undefined,
  segmentTookMs: undefined,
  cacheHit: undefined,
  degraded: undefined,
};

function normalizeSegments(segments?: SearchSegment[]): SearchSegment[] {
  if (!segments || segments.length === 0) return ['all'];
  const seen = new Set<SearchSegment>();
  for (const segment of segments) {
    if (!segment) continue;
    if (segment === 'all') return ['all'];
    seen.add(segment);
  }
  return seen.size > 0 ? Array.from(seen) : ['all'];
}

/**
 * Unified segmented search API (coins/news/users/newsBoards/portfolioAssets).
 * Keeps compatibility with legacy backend shape by normalizing older responses.
 */
export const unifiedSearch = async (
  query: string,
  options: UnifiedSearchOptions = {}
): Promise<UnifiedSearchResult> => {
  const trimmed = query.trim();
  const segments = normalizeSegments(options.segments);
  if (trimmed.length === 0) {
    return {
      coins: [],
      news: [],
      users: [],
      newsBoards: [],
      portfolioAssets: [],
      meta: {
        ...DEFAULT_SEARCH_META,
        query: '',
        segments,
      },
    };
  }

  const params = new URLSearchParams();
  params.set('q', trimmed);
  params.set('segments', segments.join(','));
  params.set('limit', String(options.limit ?? 8));
  if (options.cursor) {
    params.set('cursor', options.cursor);
  }

  type BackendSearchPayload = {
    results?: {
      coins?: BackendCoin[];
      news?: BackendNews[];
      users?: Array<{ id?: string; _id?: string; username: string }>;
      newsBoards?: SearchBoardResult[];
      portfolioAssets?: SearchPortfolioAssetResult[];
    };
    meta?: Partial<SearchMeta>;
    // Legacy compatibility fields:
    coins?: BackendCoin[];
    news?: BackendNews[];
    users?: Array<{ id?: string; _id?: string; username: string }>;
    newsBoards?: SearchBoardResult[];
    portfolioAssets?: SearchPortfolioAssetResult[];
  };

  const payload = await apiRequest<BackendSearchPayload>(`/search?${params.toString()}`, {
    signal: options.signal,
  });
  const buckets = payload.results ?? payload;
  const usersRaw = buckets.users || [];

  const users = usersRaw
    .map((user) => {
      const id = user.id || user._id;
      if (!id) return null;
      return { id, username: user.username };
    })
    .filter((user): user is { id: string; username: string } => Boolean(user));

  return {
    coins: (buckets.coins || []).map((coin) => transformBackendCoin(coin)),
    news: (buckets.news || []).map((item) => transformBackendNews(item)),
    users,
    newsBoards: buckets.newsBoards || [],
    portfolioAssets: buckets.portfolioAssets || [],
    meta: {
      ...DEFAULT_SEARCH_META,
      ...payload.meta,
      query: payload.meta?.query || trimmed,
      segments: (payload.meta?.segments as SearchSegment[] | undefined) || segments,
    },
  };
};

/**
 * Login user
 */
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const response = await apiRequest<{ user: BackendUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const user = transformBackendUser(response.user);
    await useAuthStore.getState().login(response.token, user);

    return { user, token: response.token };
  } catch (error: any) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

/**
 * Signup user
 */
export const signup = async (
  email: string,
  password: string,
  username: string
): Promise<{ user: User; token: string }> => {
  try {
    const response = await apiRequest<{ user: BackendUser; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    const user = transformBackendUser(response.user);
    await useAuthStore.getState().login(response.token, user);

    return { user, token: response.token };
  } catch (error: any) {
    throw new Error(`Signup failed: ${error.message}`);
  }
};

/**
 * Fetch all news articles saved in a specific news board
 */
export const getBoardNews = async (boardId: string): Promise<NewsItem[]> => {
  try {
    const response = await apiRequest<{
      news: Array<{
        id: string;
        title: string;
        subtitle?: string;
        imageUrl?: string;
        sourceUrl: string;
        source: string;
        publishedAt: string;
        categories: Array<{ key: string; name: string }>;
        coins: Array<{ symbol: string; name: string }>;
        metrics: { views: number; likes: number; saves: number };
      }>;
    }>(`/newsboards/${boardId}/news`);

    return response.news.map((a) => ({
      id: a.id,
      title: a.title,
      snippet: a.subtitle || '',
      subtitle: a.subtitle,
      content: a.subtitle,
      imageUrl: a.imageUrl,
      source: a.source,
      sourceUrl: a.sourceUrl,
      url: a.sourceUrl,
      publishedAt: new Date(a.publishedAt),
      categories: a.categories,
      coins: a.coins.map((c) => ({
        id: c.symbol.toLowerCase(),
        symbol: c.symbol,
        name: c.name,
        price: 0,
        change24h: 0,
      })),
      likes: a.metrics.likes,
      comments: 0,
      shares: 0,
      saveCount: a.metrics.saves,
      isSaved: true,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch board news: ${error.message}`);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiRequest<{ user: BackendUser }>('/auth/me');
    const user = transformBackendUser(response.user);
    useAuthStore.getState().setUser(user);
    return user;
  } catch (error: any) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }
};

export const getUserPreferences = async (): Promise<{
  preferredLanguage: string | null;
}> => {
  return apiRequest<{ preferredLanguage: string | null }>('/user/preferences');
};

export const patchUserPreferences = async (
  preferredLanguage: SupportedLanguage
): Promise<{ preferredLanguage: string }> => {
  return apiRequest<{ preferredLanguage: string }>('/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ preferredLanguage }),
  });
};

// ── Comments ────────────────────────────────────────────────────────

export const fetchComments = async (
  newsId: string,
  page: number = 1,
  limit: number = 20
): Promise<Comment[]> => {
  const response = await apiRequest<{ comments: Comment[] }>(
    `/news/${newsId}/comments?page=${page}&limit=${limit}`
  );
  return response.comments;
};

export const fetchReplies = async (
  newsId: string,
  commentId: string,
  page: number = 1,
  limit: number = 10
): Promise<Comment[]> => {
  const response = await apiRequest<{ replies: Comment[] }>(
    `/news/${newsId}/comments/${commentId}/replies?page=${page}&limit=${limit}`
  );
  return response.replies;
};

export const postComment = async (
  newsId: string,
  body: string,
  parentId?: string | null
): Promise<{ comment: Comment; commentCount: number }> => {
  return apiRequest<{ comment: Comment; commentCount: number }>(
    `/news/${newsId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body, parentId: parentId || undefined }),
    }
  );
};

export const deleteComment = async (
  newsId: string,
  commentId: string
): Promise<{ commentCount: number }> => {
  return apiRequest<{ commentCount: number }>(
    `/news/${newsId}/comments/${commentId}`,
    { method: 'DELETE' }
  );
};

export const searchUsers = async (
  query: string,
  limit: number = 5
): Promise<{ id: string; username: string }[]> => {
  const result = await unifiedSearch(query, { segments: ['users'], limit });
  return result.users;
};

// ── Charts / klines ────────────────────────────────────────────────────────────

export type KlineInterval = '1m' | '5m' | '1h' | '1d' | '1w';

export interface KlineRecord {
  openTime: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketTrendPoint {
  openTime: string | Date;
  value: number;
}

export interface MarketTrendResponse {
  points: MarketTrendPoint[];
  latestValue: number;
  absoluteChange24h: number;
  relativeChange24h: number;
  range: {
    interval: KlineInterval;
    from: string | Date;
    to: string | Date;
    limit: number;
  };
  constituents: number;
}

/** Maps coin symbol (e.g. BTC) to Binance trading pair (e.g. BTCUSDT) */
export function toChartSymbol(symbol: string): string {
  const s = (symbol || '').trim().toUpperCase();
  if (!s) return '';
  return s.endsWith('USDT') ? s : `${s}USDT`;
}

/**
 * Fetches OHLCV klines from the backend chart API.
 * Returns raw klines; use toLineChartData or toCandlestickData for chart libraries.
 */
export const fetchKlines = async (
  symbol: string,
  interval: KlineInterval = '1h',
  limit: number = 500,
  opts?: { from?: string; to?: string }
): Promise<KlineRecord[]> => {
  const chartSymbol = toChartSymbol(symbol);
  if (!chartSymbol) return [];
  const search = new URLSearchParams();
  search.set('symbol', chartSymbol);
  search.set('interval', interval);
  search.set('limit', String(limit));
  search.set('fields', 'minimal');
  if (opts?.from) search.set('from', opts.from);
  if (opts?.to) search.set('to', opts.to);
  const url = `${API_BASE_URL}/charts/klines?${search.toString()}`;
  const data = await fetchJsonCached<unknown>(url, { cacheTtlMs: 45_000 });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((raw) => {
    const r = raw as Record<string, unknown>;
    const ot = r.openTime;
    return {
      openTime: typeof ot === 'number' ? new Date(ot) : (ot as string | Date),
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
      quoteVolume: r.quoteVolume != null ? Number(r.quoteVolume) : undefined,
      tradeCount: r.tradeCount != null ? Number(r.tradeCount) : undefined,
    };
  });
};

export type FetchMarketTrendOptions = {
  /** Client-side GET cache TTL (default 45s). Use a shorter value for live overview widgets. */
  cacheTtlMs?: number;
  skipMemoryCache?: boolean;
};

/**
 * Fetch aggregate market trend series and 24h change summary.
 */
export const fetchMarketTrend = async (
  interval: KlineInterval = '1m',
  limit: number = 240,
  options?: FetchMarketTrendOptions
): Promise<MarketTrendResponse> => {
  const url = `${API_BASE_URL}/charts/market-trend?interval=${interval}&limit=${limit}`;
  const data = (await fetchJsonCached<Record<string, unknown>>(url, {
    cacheTtlMs: options?.cacheTtlMs ?? 45_000,
    skipMemoryCache: options?.skipMemoryCache,
  })) as Record<string, unknown>;
  const pointsRaw = Array.isArray(data?.points) ? data.points : [];
  const points = pointsRaw
    .map((point: any) => ({
      openTime: point?.openTime,
      value: Number(point?.value),
    }))
    .filter((point: MarketTrendPoint) => Number.isFinite(point.value) && point.value > 0 && Boolean(point.openTime));

  const range = data.range as Record<string, unknown> | undefined;

  return {
    points,
    latestValue: Number.isFinite(Number(data?.latestValue)) ? Number(data.latestValue) : 0,
    absoluteChange24h: Number.isFinite(Number(data?.absoluteChange24h)) ? Number(data.absoluteChange24h) : 0,
    relativeChange24h: Number.isFinite(Number(data?.relativeChange24h)) ? Number(data.relativeChange24h) : 0,
    range: {
      interval,
      from:
        typeof range?.from === 'string' || range?.from instanceof Date
          ? range.from
          : '',
      to:
        typeof range?.to === 'string' || range?.to instanceof Date
          ? range.to
          : '',
      limit:
        range != null && Number.isFinite(Number(range.limit))
          ? Number(range.limit)
          : limit,
    },
    constituents: Number.isFinite(Number(data?.constituents)) ? Number(data.constituents) : 0,
  };
};

/** Converts klines to WAGMI LineChart format: { timestamp, value }[] */
export function toLineChartData(klines: KlineRecord[]): Array<{ timestamp: number; value: number }> {
  return klines.map((k) => ({
    timestamp: typeof k.openTime === 'string' ? new Date(k.openTime).getTime() : (k.openTime as Date).getTime(),
    value: k.close,
  }));
}

/** Converts klines to WAGMI CandlestickChart format */
export function toCandlestickData(
  klines: KlineRecord[]
): Array<{ timestamp: number; open: number; high: number; low: number; close: number }> {
  return klines.map((k) => ({
    timestamp: typeof k.openTime === 'string' ? new Date(k.openTime).getTime() : (k.openTime as Date).getTime(),
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
  }));
}

/** Extracts close prices for Skia sparkline: number[] */
export function toSparklineData(klines: KlineRecord[]): number[] {
  return klines.map((k) => k.close);
}

// ── Portfolio / wallet monitoring ────────────────────────────────────────────

import { SupportedChain, WalletAddress, WalletEvent, Holdings } from '../types';

/**
 * Returns the list of blockchain networks supported by the backend configuration.
 */
export const getSupportedChains = async (): Promise<SupportedChain[]> => {
  try {
    const response = await apiRequest<{ chains: SupportedChain[] }>('/portfolio/chains');
    return response.chains;
  } catch (error: any) {
    throw new Error(`Failed to fetch supported chains: ${error.message}`);
  }
};

/**
 * Returns all wallet addresses the authenticated user has registered.
 */
export const getWallets = async (): Promise<WalletAddress[]> => {
  try {
    const response = await apiRequest<{ wallets: WalletAddress[] }>('/portfolio/wallets');
    return response.wallets;
  } catch (error: any) {
    throw new Error(`Failed to fetch wallets: ${error.message}`);
  }
};

/**
 * Registers a new wallet address for monitoring on the given chains.
 */
export const addWallet = async (
  address: string,
  chains:  string[],
  label?:  string
): Promise<WalletAddress> => {
  try {
    const response = await apiRequest<{ wallet: WalletAddress }>('/portfolio/wallets', {
      method: 'POST',
      body:   JSON.stringify({ address, chains, label }),
    });
    return response.wallet;
  } catch (error: any) {
    throw new Error(`Failed to add wallet: ${error.message}`);
  }
};

/**
 * Removes a registered wallet by its ID.
 */
export const removeWallet = async (id: string): Promise<void> => {
  try {
    await apiRequest(`/portfolio/wallets/${id}`, { method: 'DELETE' });
  } catch (error: any) {
    throw new Error(`Failed to remove wallet: ${error.message}`);
  }
};

/**
 * Returns paginated aggregated wallet events for the authenticated user.
 */
export const getWalletEvents = async (
  page:  number = 1,
  limit: number = 20
): Promise<WalletEvent[]> => {
  try {
    const response = await apiRequest<{ events: WalletEvent[] }>(
      `/portfolio/events?page=${page}&limit=${limit}`
    );
    return response.events;
  } catch (error: any) {
    throw new Error(`Failed to fetch wallet events: ${error.message}`);
  }
};

/**
 * Returns portfolio holdings (total value, 24h change, positions) for the authenticated user.
 * @param forceRefresh - if true, bypasses cache and fetches fresh from Zerion
 */
export const getHoldings = async (forceRefresh = false): Promise<Holdings> => {
  const url = forceRefresh ? '/portfolio/holdings?refresh=1' : '/portfolio/holdings';
  console.log('[Holdings] api.getHoldings: calling GET', url);
  try {
    const response = await apiRequest<{ holdings: Holdings }>(url);
    const holdings = response.holdings;
    console.log('[Holdings] api.getHoldings: success', { totalValue: holdings?.totalValue, positionsCount: holdings?.positions?.length });
    return holdings;
  } catch (error: any) {
    console.error('[Holdings] api.getHoldings: failed', error?.message);
    throw new Error(`Failed to fetch holdings: ${error.message}`);
  }
};

/**
 * Refreshes transaction status for events that are pending.
 * Call before loading events to fix stale statuses.
 */
export const refreshEventStatuses = async (): Promise<{ updated: number }> => {
  try {
    const response = await apiRequest<{ updated: number }>(
      '/portfolio/events/refresh-status',
      { method: 'POST' }
    );
    return response;
  } catch (error: any) {
    throw new Error(`Failed to refresh event statuses: ${error.message}`);
  }
};

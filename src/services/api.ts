import { Coin, NewsItem, TrendingCoin, User } from '../types';
import { useAuthStore } from '../state/useAuthStore';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4001/api';

// Backend response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Backend types
interface BackendNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  relatedCoins: string[];
  publishedAt: string | Date;
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
}

interface BackendUser {
  _id: string;
  email: string;
  username: string;
  followingCoins?: string[];
  rewardPoints?: number;
  createdAt?: string;
}

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    // Handle 401 unauthorized
    if (response.status === 401) {
      await useAuthStore.getState().logout();
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

  return {
    id: backendNews.id,
    title: backendNews.title,
    snippet: backendNews.summary,
    content: backendNews.summary, // Backend doesn't have separate content field
    imageUrl: backendNews.image,
    source: backendNews.source,
    publishedAt,
    coins: relatedCoins,
    likes: 0, // Backend doesn't track likes
    comments: 0, // Backend doesn't track comments
    shares: 0, // Backend doesn't track shares
    url: backendNews.url,
    isLiked: false, // Will be set by app store
    isSaved: false, // Will be set by app store
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
    isFollowing,
    sparklineData: undefined, // Backend doesn't provide sparkline data
  };
}

function transformBackendTrendingCoin(
  backendCoin: BackendCoin,
  category: 'trending' | 'top' | 'nft' | 'defi' = 'trending',
  isFollowing: boolean = false
): TrendingCoin {
  return {
    ...transformBackendCoin(backendCoin, isFollowing),
    rank: backendCoin.rank,
    category,
  };
}

function transformBackendUser(backendUser: BackendUser): User {
  return {
    id: backendUser._id,
    name: backendUser.username, // Backend doesn't have separate name field
    username: backendUser.username,
    verified: false, // Backend doesn't track verification
  };
}

// API Functions

/**
 * Fetch news articles from API
 */
export const fetchNews = async (
  filter: 'following' | 'explore',
  page: number = 1,
  limit: number = 50
): Promise<NewsItem[]> => {
  try {
    const endpoint = filter === 'following' 
      ? `/news/following?page=${page}&limit=${limit}`
      : `/news?page=${page}&limit=${limit}`;
    
    const response = await apiRequest<{ news: BackendNews[] }>(endpoint);
    
    // Fetch coin details for related coins
    const coinIds = new Set<string>();
    response.news.forEach((news) => {
      news.relatedCoins.forEach((coinId) => coinIds.add(coinId));
    });

    const coins: Coin[] = [];
    // Fetch coin details in parallel (limit to avoid too many requests)
    const coinIdArray = Array.from(coinIds).slice(0, 20);
    await Promise.all(
      coinIdArray.map(async (coinId) => {
        try {
          const coin = await fetchCoinDetails(coinId);
          coins.push(coin);
        } catch (error) {
          console.warn(`Failed to fetch coin ${coinId}:`, error);
        }
      })
    );

    return response.news.map((news) => transformBackendNews(news, coins));
  } catch (error: any) {
    throw new Error(`Failed to fetch news: ${error.message}`);
  }
};

/**
 * Fetch trending coins from API
 */
export const fetchTrendingCoins = async (
  category?: 'trending' | 'top' | 'nft' | 'defi'
): Promise<TrendingCoin[]> => {
  try {
    let endpoint = '/market/trending';
    
    // Map category to appropriate endpoint
    if (category === 'top') {
      endpoint = '/market/trending'; // Use trending for now, or could use top-gainers
    } else if (category === 'nft' || category === 'defi') {
      // These categories don't have specific endpoints, use trending
      endpoint = '/market/trending';
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
 * Fetch news article by ID
 */
export const fetchNewsDetails = async (newsId: string): Promise<NewsItem> => {
  try {
    const response = await apiRequest<{ news: BackendNews }>(`/news/${newsId}`);
    
    // Fetch related coins
    const coins: Coin[] = [];
    await Promise.all(
      response.news.relatedCoins.slice(0, 10).map(async (coinId) => {
        try {
          const coin = await fetchCoinDetails(coinId);
          coins.push(coin);
        } catch (error) {
          console.warn(`Failed to fetch coin ${coinId}:`, error);
        }
      })
    );

    return transformBackendNews(response.news, coins);
  } catch (error: any) {
    throw new Error(`Failed to fetch news details: ${error.message}`);
  }
};

/**
 * Like a news article (client-side only, backend doesn't support this)
 */
export const likeNews = async (newsId: string): Promise<void> => {
  // Backend doesn't have like endpoint, so this is a no-op
  // The like state is managed client-side in the app store
  return Promise.resolve();
};

/**
 * Save a news article (client-side only, backend doesn't support this)
 */
export const saveNews = async (newsId: string): Promise<void> => {
  // Backend doesn't have save endpoint, so this is a no-op
  // The save state is managed client-side in the app store
  return Promise.resolve();
};

/**
 * Follow a coin (add to wishlist)
 */
export const followCoin = async (coinId: string): Promise<void> => {
  try {
    await apiRequest(`/wishlist/${coinId}`, { method: 'POST' });
  } catch (error: any) {
    throw new Error(`Failed to follow coin: ${error.message}`);
  }
};

/**
 * Unfollow a coin (remove from wishlist)
 */
export const unfollowCoin = async (coinId: string): Promise<void> => {
  try {
    await apiRequest(`/wishlist/${coinId}`, { method: 'DELETE' });
  } catch (error: any) {
    throw new Error(`Failed to unfollow coin: ${error.message}`);
  }
};

/**
 * Get wishlist (following coins)
 */
export const getWishlist = async (): Promise<Coin[]> => {
  try {
    const response = await apiRequest<{ coins: BackendCoin[] }>('/wishlist');
    return response.coins.map((coin) => transformBackendCoin(coin, true));
  } catch (error: any) {
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }
};

/**
 * Search coins and news
 */
export const search = async (query: string): Promise<{ coins: Coin[]; news: NewsItem[] }> => {
  try {
    const response = await apiRequest<{ coins: BackendCoin[]; news: BackendNews[] }>(
      `/search?q=${encodeURIComponent(query)}`
    );

    const coins = response.coins.map((coin) => transformBackendCoin(coin));
    const news = response.news.map((newsItem) => transformBackendNews(newsItem));

    return { coins, news };
  } catch (error: any) {
    throw new Error(`Failed to search: ${error.message}`);
  }
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

export interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  price: number;
  change24h: number;
  sparklineData?: number[];
  marketCap?: number;
  volume24h?: number;
  isFollowing?: boolean;
}

export interface NewsCategory {
  key: string;
  name: string;
}

export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  content?: string;
  subtitle?: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  publishedAt: Date;
  coins: Coin[];
  categories?: NewsCategory[];
  likes: number;
  comments: number;
  shares: number;
  saveCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  url?: string;
}

export interface NewsBoard {
  id: string;
  name: string;
  newsIds: string[];
  createdAt: string;
}

export interface FeedCardProps {
  item: NewsItem;
  variant?: 'compact' | 'expanded' | 'grid';
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onSave?: (id: string) => void;
  onPress?: (id: string) => void;
  onCoinPress?: (coinId: string) => void;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  username: string;
  parentId: string | null;
  body: string;
  replyCount: number;
  createdAt: string;
}

export interface TrendingCoin extends Coin {
  rank: number;
  category?: 'trending' | 'top' | 'nft' | 'defi';
}

export type FeedFilter = 'following' | 'explore';
export type ExploreCategory = 'trending' | 'top' | 'nft' | 'defi';

export interface AppState {
  feedFilter: FeedFilter;
  exploreCategory: ExploreCategory;
  isDarkMode: boolean;
  likedNews: string[];
  savedNews: string[];
  followingCoins: string[];
  boards: NewsBoard[];
  setFeedFilter: (filter: FeedFilter) => void;
  setExploreCategory: (category: ExploreCategory) => void;
  toggleDarkMode: () => void;
  toggleLike: (newsId: string) => void;
  toggleSave: (newsId: string) => void;
  toggleFollowCoin: (coinId: string) => Promise<void>;
  syncFollowingCoins: () => Promise<void>;
  setBoards: (boards: NewsBoard[]) => void;
  addBoard: (board: NewsBoard) => void;
  markSaved: (newsId: string) => void;
  isSavedToAnyBoard: (newsId: string) => boolean;
}

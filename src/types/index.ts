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

export interface CoinStats {
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
  total_supply?: number | null;
  max_supply?: number | null;
  ath?: number;
  ath_date?: string;
  atl?: number;
  atl_date?: string;
  contract_address?: string | null;
}

export interface NewsCategory {
  key: string;
  name: string;
}

export type ReactionType =
  | 'appreciate'
  | 'insightful'
  | 'bullish'
  | 'risk'
  | 'deepDive'
  | 'debatable';

export interface ReactionCounts {
  appreciate: number;
  insightful: number;
  bullish: number;
  risk: number;
  deepDive: number;
  debatable: number;
  total: number;
}

export const REACTIONS: ReadonlyArray<{
  type: ReactionType;
  emoji: string;
  label: string;
}> = [
  { type: 'appreciate', emoji: '\u{1F44D}', label: 'Appreciate' },
  { type: 'insightful', emoji: '\u{1F4CA}', label: 'Insightful' },
  { type: 'bullish', emoji: '\u{1F680}', label: 'Bullish' },
  { type: 'risk', emoji: '\u{1F4C9}', label: 'Risk' },
  { type: 'deepDive', emoji: '\u{1F50D}', label: 'Deep Dive' },
  { type: 'debatable', emoji: '\u{1F504}', label: 'Debatable' },
];

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
  relatedCoins?: string[];
  categories?: NewsCategory[];
  likes: number;
  comments: number;
  shares: number;
  saveCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  url?: string;
  reactions?: ReactionCounts;
  userReaction?: ReactionType | null;
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
  onReact?: (id: string, type: ReactionType) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onSave?: (id: string) => void;
  onPress?: (id: string) => void;
  onCoinPress?: (coinId: string) => void;
}

export interface Mention {
  userId: string;
  username: string;
  offset: number;
  length: number;
}

export interface Comment {
  id: string;
  newsId: string;
  userId: string;
  username: string;
  parentId: string | null;
  body: string;
  mentions: Mention[];
  replyCount: number;
  createdAt: string;
}

export interface TrendingCoin extends Coin {
  rank: number;
  category?: 'trending' | 'top' | 'nft' | 'defi';
}

export type FeedFilter = 'following' | 'explore';
export type ExploreCategory = 'trending' | 'top' | 'nft' | 'defi';

// ── Portfolio / wallet monitoring ────────────────────────────────────────────

export interface SupportedChain {
  id:     string;
  name:   string;
  symbol: string;
}

export interface WalletAddress {
  id:        string;
  address:   string;
  chains:    string[];
  label?:    string;
  createdAt: string;
}

export type WalletEventType =
  | 'token_transfer'
  | 'native_transfer'
  | 'contract_interaction'
  | 'multi_chain_activity';

export type TxStatus = 'success' | 'failed' | 'pending';

export interface WalletEventActivity {
  txHash?:      string;
  txStatus?:    TxStatus | null;
  explorerUrl?: string;
  blockNum?:    string;
  asset?:       string;
  value?:      number;
  fromAddress?: string;
  toAddress?:   string;
}

export interface WalletEvent {
  id:                string;
  address:           string;
  chain:             string;
  type:              WalletEventType;
  rawEventCount:     number;
  transactionCount?: number;
  eventSummaries?:   string[];
  enrichedData?:     Record<string, unknown>;
  aggregatedAt:      string;
  activity?:         WalletEventActivity;
}

export interface HoldingPosition {
  name:     string;
  symbol:   string;
  quantity: number;
  value:    number;
  chain:    string;
}

export interface Holdings {
  totalValue:        number;
  absoluteChange24h: number;
  relativeChange24h: number;
  positions:        HoldingPosition[];
}

export interface AppState {
  feedFilter: FeedFilter;
  exploreCategory: ExploreCategory;
  isDarkMode: boolean;
  likedNews: string[];
  savedNews: string[];
  followingCoins: string[];
  boards: NewsBoard[];
  newsReactions: Record<string, ReactionType>;
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
  setReaction: (newsId: string, type: ReactionType | null) => void;
}

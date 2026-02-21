import { create } from 'zustand';
import { AppState, FeedFilter, ExploreCategory, NewsBoard, ReactionType } from '../types';
import { getWishlist } from '../services/api';
import { useAuthStore } from './useAuthStore';

export const useAppStore = create<AppState>((set, get) => ({
  feedFilter: 'following',
  exploreCategory: 'trending',
  isDarkMode: false,
  likedNews: [],
  savedNews: [],
  followingCoins: [],
  boards: [],
  newsReactions: {},

  setFeedFilter: (filter: FeedFilter) => set({ feedFilter: filter }),

  setExploreCategory: (category: ExploreCategory) => set({ exploreCategory: category }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  toggleLike: (newsId: string) => set((state) => ({
    likedNews: state.likedNews.includes(newsId)
      ? state.likedNews.filter(id => id !== newsId)
      : [...state.likedNews, newsId],
  })),

  setReaction: (newsId: string, type: ReactionType | null) =>
    set((state) => {
      const next = { ...state.newsReactions };
      if (type) {
        next[newsId] = type;
      } else {
        delete next[newsId];
      }
      return { newsReactions: next };
    }),

  toggleSave: (newsId: string) => set((state) => ({
    savedNews: state.savedNews.includes(newsId)
      ? state.savedNews.filter(id => id !== newsId)
      : [...state.savedNews, newsId],
  })),

  // Board-aware save state helpers
  setBoards: (boards: NewsBoard[]) => set({ boards }),

  addBoard: (board: NewsBoard) =>
    set((state) => ({ boards: [board, ...state.boards] })),

  markSaved: (newsId: string) =>
    set((state) => ({
      savedNews: state.savedNews.includes(newsId)
        ? state.savedNews
        : [...state.savedNews, newsId],
    })),

  isSavedToAnyBoard: (newsId: string): boolean => {
    return get().boards.some((board) => board.newsIds.includes(newsId));
  },

  toggleFollowCoin: async (coinId: string) => {
    const { followingCoins } = get();
    const isFollowing = followingCoins.includes(coinId);

    set({
      followingCoins: isFollowing
        ? followingCoins.filter(id => id !== coinId)
        : [...followingCoins, coinId],
    });

    if (useAuthStore.getState().isAuthenticated) {
      try {
        if (isFollowing) {
          const { unfollowCoin } = await import('../services/api');
          await unfollowCoin(coinId);
        } else {
          const { followCoin } = await import('../services/api');
          await followCoin(coinId);
        }
      } catch (error) {
        set({ followingCoins });
        console.error('Failed to sync follow status:', error);
      }
    }
  },

  syncFollowingCoins: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ followingCoins: [] });
      return;
    }

    try {
      const wishlist = await getWishlist();
      set({ followingCoins: wishlist.map(coin => coin.id) });
    } catch (error) {
      console.error('Failed to sync following coins:', error);
    }
  },
}));

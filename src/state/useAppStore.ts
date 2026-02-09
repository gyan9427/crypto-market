import { create } from 'zustand';
import { AppState, FeedFilter, ExploreCategory } from '../types';
import { getWishlist } from '../services/api';
import { useAuthStore } from './useAuthStore';

export const useAppStore = create<AppState>((set, get) => ({
  feedFilter: 'following',
  exploreCategory: 'trending',
  isDarkMode: false,
  likedNews: [],
  savedNews: [],
  followingCoins: [], // Initialize empty, will be synced from backend

  setFeedFilter: (filter: FeedFilter) => set({ feedFilter: filter }),

  setExploreCategory: (category: ExploreCategory) => set({ exploreCategory: category }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  toggleLike: (newsId: string) => set((state) => ({
    likedNews: state.likedNews.includes(newsId)
      ? state.likedNews.filter(id => id !== newsId)
      : [...state.likedNews, newsId],
  })),

  toggleSave: (newsId: string) => set((state) => ({
    savedNews: state.savedNews.includes(newsId)
      ? state.savedNews.filter(id => id !== newsId)
      : [...state.savedNews, newsId],
  })),

  toggleFollowCoin: async (coinId: string) => {
    const { followingCoins } = get();
    const isFollowing = followingCoins.includes(coinId);
    
    // Optimistically update UI
    set({
      followingCoins: isFollowing
        ? followingCoins.filter(id => id !== coinId)
        : [...followingCoins, coinId],
    });

    // Sync with backend if authenticated
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
        // Revert on error
        set({ followingCoins });
        console.error('Failed to sync follow status:', error);
      }
    }
  },

  // Helper method to sync following coins from backend
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
      // Keep existing state on error
    }
  },
}));

import { create } from 'zustand';
import { AppState, FeedFilter, ExploreCategory } from '../types';

export const useAppStore = create<AppState>((set) => ({
  feedFilter: 'following',
  exploreCategory: 'trending',
  isDarkMode: false,
  likedNews: [],
  savedNews: [],
  followingCoins: ['bitcoin', 'ethereum', 'solana'],

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

  toggleFollowCoin: (coinId: string) => set((state) => ({
    followingCoins: state.followingCoins.includes(coinId)
      ? state.followingCoins.filter(id => id !== coinId)
      : [...state.followingCoins, coinId],
  })),
}));

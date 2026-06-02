import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import i18next from '@/src/i18n';
import {
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/src/constants/languages';
import { resolveDeviceLanguage } from '@/src/utils/locale';
import { setApiLocaleLanguage } from '@/src/services/apiLocale';
import {
  AppState,
  FeedFilter,
  ExploreCategory,
  NewsBoard,
  ReactionType,
  ThemePreference,
} from '../types';
import { getWishlist } from '../services/api';
import { useAuthStore } from './useAuthStore';

const THEME_STORAGE_KEY = '@crypto_app_theme_preference';
const LANGUAGE_STORAGE_KEY = '@crypto_app_language';
const LANGUAGE_SYNC_PENDING_KEY = '@crypto_app_language_sync_pending';

function parseThemePreference(raw: string | null): ThemePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export const useAppStore = create<AppState>((set, get) => {
  const applyResolvedLanguage = (lang: SupportedLanguage) => {
    setApiLocaleLanguage(lang);
    set({ language: lang });
    void i18next.changeLanguage(lang);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return {
    /** Default explore: `/news/following` requires login; anonymous users must not hit it on first load. */
    feedFilter: 'explore',
    exploreCategory: 'analysis',
    themePreference: 'system' as ThemePreference,
    language: 'en' as SupportedLanguage,
    likedNews: [],
    savedNews: [],
    followingCoins: [],
    boards: [],
    newsReactions: {},
    marketSnapshot: null,
    marketSnapshotError: null,
    designSystemV2Dev: false,

    setDesignSystemV2Dev: (enabled: boolean) => set({ designSystemV2Dev: enabled }),

    setMarketSnapshot: (snapshot, error = null) =>
      set({
        marketSnapshot: snapshot,
        marketSnapshotError: error ?? null,
      }),

    setFeedFilter: (filter: FeedFilter) => set({ feedFilter: filter }),

    setExploreCategory: (category: ExploreCategory) => set({ exploreCategory: category }),

    setThemePreference: (preference: ThemePreference) => {
      set({ themePreference: preference });
      void AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    },

    hydrateThemePreference: async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const themePreference = parseThemePreference(raw);
        set({ themePreference });
      } catch {
        // keep default
      }
    },

    hydrateLanguage: async () => {
      try {
        const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (raw && isSupportedLanguage(raw)) {
          applyResolvedLanguage(raw);
          return;
        }
      } catch {
        try {
          await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
      applyResolvedLanguage(resolveDeviceLanguage());
    },

    setLanguage: async (lang: SupportedLanguage) => {
      applyResolvedLanguage(lang);
      if (!useAuthStore.getState().isAuthenticated) {
        try {
          await AsyncStorage.removeItem(LANGUAGE_SYNC_PENDING_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        const { patchUserPreferences } = await import('../services/api');
        await patchUserPreferences(lang);
        await AsyncStorage.removeItem(LANGUAGE_SYNC_PENDING_KEY);
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setUser({ ...user, preferredLanguage: lang });
        }
      } catch {
        await AsyncStorage.setItem(LANGUAGE_SYNC_PENDING_KEY, '1');
      }
    },

    syncLanguageFromServer: async () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      try {
        const { getUserPreferences } = await import('../services/api');
        const { preferredLanguage } = await getUserPreferences();
        if (preferredLanguage === null) return;
        const lang = isSupportedLanguage(preferredLanguage) ? preferredLanguage : 'en';
        if (lang !== get().language) {
          applyResolvedLanguage(lang);
        }
        await AsyncStorage.removeItem(LANGUAGE_SYNC_PENDING_KEY);
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setUser({ ...user, preferredLanguage: lang });
        }
      } catch {
        /* network */
      }
    },

    retryLanguageSync: async () => {
      if (!useAuthStore.getState().isAuthenticated) return;
      const pending = await AsyncStorage.getItem(LANGUAGE_SYNC_PENDING_KEY);
      if (!pending) return;
      const lang = get().language;
      try {
        const { patchUserPreferences } = await import('../services/api');
        await patchUserPreferences(lang);
        await AsyncStorage.removeItem(LANGUAGE_SYNC_PENDING_KEY);
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setUser({ ...user, preferredLanguage: lang });
        }
      } catch {
        /* keep pending */
      }
    },

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
  };
});

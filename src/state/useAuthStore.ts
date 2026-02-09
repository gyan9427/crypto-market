import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = '@crypto_auth_token';
const USER_KEY = '@crypto_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (token: string, user: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  setToken: async (token: string | null) => {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    set({ token, isAuthenticated: !!token });
  },

  setUser: (user: User | null) => {
    if (user) {
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      AsyncStorage.removeItem(USER_KEY);
    }
    set({ user });
  },

  initialize: async () => {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await get().logout();
    }
  },
}));

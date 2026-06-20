import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { User } from '../types';
import { cacheRegistry } from '@/src/runtime/cacheRegistry';
import { bindAuthSession } from '@/src/services/authSession';
import { bumpGeneration, createRequestGuard } from '@/src/runtime/asyncRequestGuard';

const TOKEN_KEY = 'nayft_auth_token_secure';
const LEGACY_TOKEN_KEY = '@crypto_auth_token';
const USER_KEY = '@crypto_user';
const MIGRATION_KEY = '@nayft_secure_token_migrated';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  migrateTokenToSecureStore: () => Promise<void>;
}

/** Tier 1 fast path — read only, no migration write. */
async function readTokenFast(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(TOKEN_KEY);
    if (secure) return secure;
  } catch {
    /* SecureStore unavailable on web — fall back */
  }
  return AsyncStorage.getItem(LEGACY_TOKEN_KEY);
}

async function migrateTokenToSecureStoreInternal(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  if (migrated === '1') return;
  const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    await AsyncStorage.setItem(MIGRATION_KEY, '1');
  } catch {
    /* keep legacy */
  }
}

async function writeToken(token: string | null): Promise<void> {
  if (token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.id !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (token: string, user: User) => {
    await writeToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    bumpGeneration('auth:token');
    bumpGeneration('auth:bg-sync');
    const { resetAuthBackgroundSync } = await import('@/src/services/authBackgroundSync');
    resetAuthBackgroundSync();
    cacheRegistry.purgeUserScoped();
    await writeToken(null);
    await AsyncStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  setToken: async (token: string | null) => {
    if (token) {
      cacheRegistry.purgeOnAuthChange(token);
    }
    await writeToken(token);
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

  migrateTokenToSecureStore: async () => {
    const guard = createRequestGuard('auth:token');
    await migrateTokenToSecureStoreInternal();
    if (guard.isStale()) return;
  },

  initialize: async () => {
    try {
      const [token, userStr] = await Promise.all([readTokenFast(), AsyncStorage.getItem(USER_KEY)]);
      const user = parseUser(userStr);
      if (token && user) {
        set({ token, user, isAuthenticated: true });
      } else if (token && !user) {
        await writeToken(null);
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await get().logout();
    }
  },
}));

bindAuthSession({
  getToken: () => useAuthStore.getState().token,
  getIsAuthenticated: () => useAuthStore.getState().isAuthenticated,
  logout: () => useAuthStore.getState().logout(),
  setUser: (user) => useAuthStore.getState().setUser(user),
  login: (token, user) => useAuthStore.getState().login(token, user),
});

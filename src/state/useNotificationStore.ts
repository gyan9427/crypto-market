import { create } from 'zustand';
import type { NotificationItem } from '@/src/services/notificationsApi';

interface NotificationState {
  items: NotificationItem[];
  nextCursor?: string;
  hasMore: boolean;
  unreadCount: number;
  loading: boolean;
  syncing: boolean;
  lastSeq: number;
  mergeFromFetch: (page: {
    data: NotificationItem[];
    page: { nextCursor?: string; hasMore: boolean };
    unreadCount: number;
  }) => void;
  prependOne: (n: NotificationItem) => void;
  patchOne: (id: string, patch: Partial<NotificationItem>) => void;
  removeOne: (id: string) => void;
  setUnreadCount: (n: number) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  hasMore: false,
  unreadCount: 0,
  loading: false,
  syncing: false,
  lastSeq: 0,

  mergeFromFetch: (payload) => {
    const byId = new Map<string, NotificationItem>();
    for (const x of get().items) byId.set(x.id, x);
    for (const x of payload.data) byId.set(x.id, x);
    const merged = [...byId.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const maxSeq = merged.reduce((m, x) => Math.max(m, x.userSeq ?? 0), get().lastSeq);
    set({
      items: merged,
      nextCursor: payload.page.nextCursor,
      hasMore: payload.page.hasMore,
      unreadCount: payload.unreadCount,
      lastSeq: maxSeq,
    });
  },

  prependOne: (n) =>
    set((s) => ({
      items: [n, ...s.items.filter((x) => x.id !== n.id)],
      lastSeq: Math.max(s.lastSeq, n.userSeq ?? 0),
    })),

  patchOne: (id, patch) =>
    set((s) => ({
      items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),

  removeOne: (id) =>
    set((s) => ({
      items: s.items.filter((x) => x.id !== id),
    })),

  setUnreadCount: (n) => set({ unreadCount: n }),

  reset: () =>
    set({
      items: [],
      nextCursor: undefined,
      hasMore: false,
      unreadCount: 0,
      loading: false,
      syncing: false,
      lastSeq: 0,
    }),
}));

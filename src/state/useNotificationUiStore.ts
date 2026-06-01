import { create } from 'zustand';
import type { NotificationItem } from '@/src/services/notificationsApi';

interface BannerItem {
  notification: NotificationItem;
}

interface NotificationUiState {
  bannerQueue: BannerItem[];
  enqueueBanner: (n: NotificationItem) => void;
  dequeueBanner: () => void;
}

export const useNotificationUiStore = create<NotificationUiState>((set) => ({
  bannerQueue: [],

  enqueueBanner: (notification) =>
    set((s) => ({
      bannerQueue:
        notification.priority === 'CRITICAL' || notification.priority === 'IMPORTANT'
          ? [...s.bannerQueue, { notification }].slice(-5)
          : s.bannerQueue,
    })),

  dequeueBanner: () =>
    set((s) => ({
      bannerQueue: s.bannerQueue.slice(1),
    })),
}));

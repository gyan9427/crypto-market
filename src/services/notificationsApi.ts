import { apiRequest } from '@/src/services/api';

let notificationsApiUnsupported = false;

function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('404') || msg.includes('not found');
}

function markUnsupportedOn404(err: unknown): never {
  if (isNotFoundError(err)) {
    notificationsApiUnsupported = true;
  }
  throw err;
}

export interface NotificationItem {
  id: string;
  userId: string;
  category: string;
  type: string;
  priority: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: string;
  userSeq: number;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsListResponse {
  data: NotificationItem[];
  page: { nextCursor?: string; hasMore: boolean };
  unreadCount: number;
}

export const notificationsApi = {
  list(params?: {
    limit?: number;
    cursor?: string;
    status?: 'unread' | 'all' | 'read';
    category?: string;
    sinceSeq?: number;
  }): Promise<NotificationsListResponse> {
    if (notificationsApiUnsupported) {
      return Promise.resolve({
        data: [],
        page: { hasMore: false },
        unreadCount: 0,
      });
    }
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.cursor) q.set('cursor', params.cursor);
    if (params?.status) q.set('status', params.status);
    if (params?.category) q.set('category', params.category);
    if (params?.sinceSeq !== undefined) q.set('sinceSeq', String(params.sinceSeq));
    const qs = q.toString();
    return apiRequest<NotificationsListResponse>(`/notifications${qs ? `?${qs}` : ''}`).catch(
      markUnsupportedOn404
    );
  },

  markRead(id: string): Promise<{ ok: boolean }> {
    if (notificationsApiUnsupported) return Promise.resolve({ ok: false });
    return apiRequest<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    }).catch(markUnsupportedOn404);
  },

  markAllRead(category?: string): Promise<{ updated: number }> {
    if (notificationsApiUnsupported) return Promise.resolve({ updated: 0 });
    return apiRequest<{ updated: number }>(`/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category ? { category } : {}),
    }).catch(markUnsupportedOn404);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    if (notificationsApiUnsupported) return Promise.resolve({ ok: false });
    return apiRequest<{ ok: boolean }>(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(markUnsupportedOn404);
  },

  getUnreadCount(): Promise<{ unreadCount: number }> {
    if (notificationsApiUnsupported) return Promise.resolve({ unreadCount: 0 });
    return apiRequest<{ unreadCount: number }>(`/notification-unread-count`).catch(
      markUnsupportedOn404
    );
  },

  getPreferences(): Promise<Record<string, unknown>> {
    if (notificationsApiUnsupported) return Promise.resolve({});
    return apiRequest<Record<string, unknown>>(`/notification-preferences`).catch(
      markUnsupportedOn404
    );
  },

  patchPreferences(patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (notificationsApiUnsupported) return Promise.resolve({});
    return apiRequest<Record<string, unknown>>(`/notification-preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(markUnsupportedOn404);
  },
};

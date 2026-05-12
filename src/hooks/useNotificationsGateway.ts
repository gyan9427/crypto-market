import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/state/useAuthStore';
import { buildNotificationsWsUrl } from '@/src/config/wsBaseUrl';
import { useNotificationStore } from '@/src/state/useNotificationStore';
import { useNotificationUiStore } from '@/src/state/useNotificationUiStore';
import { notificationsApi } from '@/src/services/notificationsApi';
import type { NotificationItem } from '@/src/services/notificationsApi';

function backoffMs(attempt: number): number {
  const cap = 30000;
  const base = 250;
  const exp = Math.min(cap, base * 2 ** attempt);
  return Math.floor(Math.random() * exp);
}

/** Opens authenticated WS for notification fanout + reconciles missed inbox via REST. */
export function useNotificationsGateway(enabled: boolean): void {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closingRef = useRef(false);

  useEffect(() => {
    closingRef.current = false;

    if (!enabled || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      useNotificationStore.getState().reset();
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const syncMissed = () => {
      const seq = useNotificationStore.getState().lastSeq;
      notificationsApi
        .list({ sinceSeq: seq, limit: 50 })
        .then((r) => useNotificationStore.getState().mergeFromFetch(r))
        .catch(() => {});
    };

    const connect = () => {
      const url = buildNotificationsWsUrl(token);
      if (!url || closingRef.current) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        void ws.send(JSON.stringify({ type: 'notification_subscribe', token }));
        syncMissed();
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as Record<string, unknown>;
          if (msg.type === 'notification:new' && msg.notification && typeof msg.notification === 'object') {
            const n = msg.notification as NotificationItem;
            useNotificationStore.getState().prependOne(n);
            useNotificationUiStore.getState().enqueueBanner(n);
          }
          if (msg.type === 'notification:badge_update' && typeof msg.unreadCount === 'number') {
            useNotificationStore.getState().setUnreadCount(msg.unreadCount);
          }
          if (msg.type === 'notification:update' && typeof msg.id === 'string' && msg.patch && typeof msg.patch === 'object') {
            useNotificationStore.getState().patchOne(msg.id, msg.patch as Partial<NotificationItem>);
          }
          if (msg.type === 'notification:delete' && typeof msg.id === 'string') {
            useNotificationStore.getState().removeOne(msg.id);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onerror = () => {
        /* onclose handles reconnect */
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closingRef.current) return;
        attemptRef.current += 1;
        reconnectTimer = setTimeout(connect, backoffMs(attemptRef.current));
      };
    };

    connect();

    return () => {
      closingRef.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, token]);
}

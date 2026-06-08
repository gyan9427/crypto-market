import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/state/useAuthStore';
import { buildNotificationsWsUrl } from '@/src/config/wsBaseUrl';
import { useNotificationStore } from '@/src/state/useNotificationStore';
import { useNotificationUiStore } from '@/src/state/useNotificationUiStore';
import { notificationsApi } from '@/src/services/notificationsApi';
import type { NotificationItem } from '@/src/services/notificationsApi';
import { wsRegistry, bindWsOpenHandler } from '@/src/runtime/wsConnectionRegistry';

const OWNER_ID = 'tabs-layout';

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
  const generationRef = useRef(0);

  useEffect(() => {
    closingRef.current = false;

    if (!enabled || !token) {
      wsRegistry.release('notifications', OWNER_ID);
      wsRef.current = null;
      useNotificationStore.getState().reset();
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const generation = ++generationRef.current;

    const syncMissed = () => {
      const seq = useNotificationStore.getState().lastSeq;
      notificationsApi
        .list({ sinceSeq: seq, limit: 50 })
        .then((r) => useNotificationStore.getState().mergeFromFetch(r))
        .catch(() => {});
    };

    const attachHandlers = (ws: WebSocket) => {
      const onOpen = () => {
        if (generation !== generationRef.current) return;
        attemptRef.current = 0;
        void ws.send(JSON.stringify({ type: 'ws_auth', token, protocol: 2 }));
        void ws.send(JSON.stringify({ type: 'notification_subscribe', token }));
        syncMissed();
      };

      bindWsOpenHandler(ws, onOpen);

      ws.onmessage = (evt) => {
        if (generation !== generationRef.current) return;
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
        if (generation !== generationRef.current || closingRef.current) return;
        wsRef.current = null;
        attemptRef.current += 1;
        reconnectTimer = setTimeout(connect, backoffMs(attemptRef.current));
      };
    };

    const connect = () => {
      const url = buildNotificationsWsUrl(token);
      if (!url || closingRef.current) return;

      const ws = wsRegistry.acquire('notifications', OWNER_ID, () => new WebSocket(url)) as WebSocket;
      wsRef.current = ws;
      attachHandlers(ws);
    };

    connect();

    return () => {
      closingRef.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
      }
      wsRegistry.release('notifications', OWNER_ID);
      wsRef.current = null;
    };
  }, [enabled, token]);
}

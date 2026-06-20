import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';
import { Holdings, WalletEvent, TxStatus } from '../types';
import { usePortfolioStore } from '../state/usePortfolioStore';
import { invalidatePortfolioIntelligenceCache } from '@/src/services/portfolioIntelligenceApi';
import { usePortfolioIntelligenceStore } from '@/src/state/usePortfolioIntelligenceStore';
import { useAuthStore } from '@/src/state/useAuthStore';

const HEARTBEAT_STALE_MS = 45000;
const HEARTBEAT_CHECK_MS = 5000;

interface PortfolioHeartbeatMessage {
  type: 'portfolio_heartbeat';
  seq: number;
  emittedAt: string;
  healthy: true;
}

interface PortfolioSyncReadyMessage {
  type: 'portfolio_sync_ready';
  seq: number;
  emittedAt: string;
  mode: 'live';
  addresses: string[];
}

interface PortfolioSubscribedMessage {
  type: 'portfolio_subscribed';
  seq: number;
  emittedAt: string;
  addresses: string[];
}

interface PortfolioWalletEventMessage {
  type: 'wallet_event';
  seq: number;
  emittedAt: string;
  event: WalletEvent;
}

interface PortfolioWalletStatusMessage {
  type: 'wallet_status';
  seq: number;
  emittedAt: string;
  update: {
    eventId: string;
    txStatus: TxStatus;
    explorerUrl?: string;
  };
}

interface PortfolioHoldingsDeltaMessage {
  type: 'holdings_delta';
  seq: number;
  emittedAt: string;
  delta: {
    holdings: Holdings;
  };
}

interface PortfolioAnalyticsRevisionMessage {
  type: 'analytics_revision';
  seq: number;
  emittedAt: string;
  revision: number;
  stale?: boolean;
}

type PortfolioInboundMessage =
  | PortfolioHeartbeatMessage
  | PortfolioSyncReadyMessage
  | PortfolioSubscribedMessage
  | PortfolioWalletEventMessage
  | PortfolioWalletStatusMessage
  | PortfolioHoldingsDeltaMessage
  | PortfolioAnalyticsRevisionMessage;

interface UsePortfolioLiveStreamOptions {
  addresses: string[];
  enabled?: boolean;
}

function resolveWsUrl(): string {
  const base = resolveApiBaseUrl();
  const parsed = new URL(base.startsWith('http') ? base : `https://${base}`);
  parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  parsed.pathname = '/ws';
  parsed.search = '';
  return parsed.toString();
}

function normalizeAddresses(addresses: string[]): string[] {
  return [...new Set(addresses.map((a) => a.trim().toLowerCase()).filter(Boolean))].sort();
}

export function usePortfolioLiveStream(options: UsePortfolioLiveStreamOptions): { isConnected: boolean } {
  const { enabled = true } = options;
  const token = useAuthStore((s) => s.token);
  const addresses = useMemo(() => normalizeAddresses(options.addresses), [options.addresses]);
  const addressesKey = addresses.join('|');

  const appendEvent = usePortfolioStore((state) => state.appendEvent);
  const applyStatusUpdate = usePortfolioStore((state) => state.applyStatusUpdate);
  const applyHoldingsDelta = usePortfolioStore((state) => state.applyHoldingsDelta);
  const setSessionMode = usePortfolioStore((state) => state.setSessionMode);
  const setStreamHealthy = usePortfolioStore((state) => state.setStreamHealthy);
  const markStreamHeartbeat = usePortfolioStore((state) => state.markStreamHeartbeat);
  const runRecoverySync = usePortfolioStore((state) => state.runRecoverySync);

  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastHeartbeatRef = useRef<number>(0);
  const disposedRef = useRef(false);
  const recoveryTriggeredRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    recoveryTriggeredRef.current = false;

    const clearReconnect = (): void => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = (): void => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (!ws) return;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    const triggerRecoveryIfNeeded = (): void => {
      if (recoveryTriggeredRef.current) return;
      recoveryTriggeredRef.current = true;
      setSessionMode('degraded');
      setStreamHealthy(false);
      void runRecoverySync();
    };

    const scheduleReconnect = (): void => {
      clearReconnect();
      if (disposedRef.current || !enabled || addresses.length === 0) return;
      const attempt = reconnectAttemptRef.current;
      const backoff = Math.min(12000, 1000 * Math.pow(2, Math.max(0, attempt)));
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, backoff);
      reconnectAttemptRef.current = attempt + 1;
    };

    const handleMessage = (message: PortfolioInboundMessage): void => {
      switch (message.type) {
        case 'portfolio_subscribed': {
          return;
        }
        case 'portfolio_sync_ready': {
          lastHeartbeatRef.current = Date.now();
          reconnectAttemptRef.current = 0;
          recoveryTriggeredRef.current = false;
          markStreamHeartbeat();
          setSessionMode('live');
          setStreamHealthy(true);
          return;
        }
        case 'portfolio_heartbeat': {
          lastHeartbeatRef.current = Date.now();
          markStreamHeartbeat();
          return;
        }
        case 'wallet_event': {
          appendEvent(message.event);
          return;
        }
        case 'wallet_status': {
          applyStatusUpdate({
            eventId: message.update.eventId,
            txStatus: message.update.txStatus,
            explorerUrl: message.update.explorerUrl,
          });
          return;
        }
        case 'holdings_delta': {
          applyHoldingsDelta(message.delta.holdings);
          return;
        }
        case 'analytics_revision': {
          if (message.stale !== true) {
            invalidatePortfolioIntelligenceCache({ refetch: true });
            usePortfolioIntelligenceStore.getState().invalidate({ refetch: true });
          } else {
            invalidatePortfolioIntelligenceCache();
            usePortfolioIntelligenceStore.getState().invalidate({ refetch: false });
          }
          return;
        }
      }
    };

    const connect = (): void => {
      if (disposedRef.current || !enabled || addresses.length === 0 || !token) return;

      closeSocket();
      const ws = new WebSocket(resolveWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposedRef.current) return;
        setIsConnected(true);
        lastHeartbeatRef.current = Date.now();
        ws.send(JSON.stringify({ type: 'ws_auth', token, protocol: 2 }));
        ws.send(JSON.stringify({ type: 'portfolio_subscribe', addresses }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as PortfolioInboundMessage;
          handleMessage(msg);
        } catch {
          /* ignore malformed payload */
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        if (disposedRef.current) return;
        setIsConnected(false);
        triggerRecoveryIfNeeded();
        scheduleReconnect();
      };
    };

    if (enabled && addresses.length > 0 && token) {
      setSessionMode('bootstrap');
      connect();
    } else {
      setIsConnected(false);
      setSessionMode('bootstrap');
      setStreamHealthy(false);
      closeSocket();
    }

    if (!heartbeatCheckRef.current) {
      heartbeatCheckRef.current = setInterval(() => {
        if (disposedRef.current || !enabled || addresses.length === 0) return;
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        if (!lastHeartbeatRef.current) return;
        if (Date.now() - lastHeartbeatRef.current > HEARTBEAT_STALE_MS) {
          triggerRecoveryIfNeeded();
          ws.close();
        }
      }, HEARTBEAT_CHECK_MS);
    }

    return () => {
      disposedRef.current = true;
      clearReconnect();
      if (heartbeatCheckRef.current) {
        clearInterval(heartbeatCheckRef.current);
        heartbeatCheckRef.current = null;
      }
      closeSocket();
      setIsConnected(false);
    };
  }, [
    addressesKey,
    appendEvent,
    applyHoldingsDelta,
    applyStatusUpdate,
    enabled,
    markStreamHeartbeat,
    runRecoverySync,
    setSessionMode,
    setStreamHealthy,
    addresses,
    token,
  ]);

  return { isConnected };
}

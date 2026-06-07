import {
  recordWsDuplicateConnection,
  recordWsReconnect,
  recordWsSubscriptionDuplicate,
} from '@/src/runtime/wsLifecycleMetrics';
import { isWsRegistryEnabled } from '@/src/config/featureFlags';

type Channel = 'notifications' | 'risk' | 'portfolio' | 'news';

type WsLike = {
  close: () => void;
  readyState: number;
  onopen?: (() => void) | null;
};

/** Bind onopen and invoke immediately if the socket is already connected (registry reuse). */
export function bindWsOpenHandler(ws: WsLike, onOpen: () => void): void {
  ws.onopen = onOpen;
  if (ws.readyState === 1) onOpen();
}

type Entry = {
  ws: WsLike;
  ownerId: string;
  channel: Channel;
};

const registry = new Map<Channel, Entry>();
const reconnectInFlight = new Map<Channel, Promise<void>>();
let lifecycleStarted = false;
let registryPaused = false;

export const wsRegistry = {
  acquire(channel: Channel, ownerId: string, factory: () => WsLike): WsLike {
    if (!isWsRegistryEnabled()) {
      return factory();
    }
    const existing = registry.get(channel);
    if (existing && existing.ownerId === ownerId && existing.ws.readyState <= 1) {
      recordWsDuplicateConnection();
      return existing.ws;
    }
    if (existing) {
      try {
        existing.ws.close();
      } catch {
        /* ignore */
      }
    }
    const ws = factory();
    registry.set(channel, { ws, ownerId, channel });
    return ws;
  },

  release(channel: Channel, ownerId: string): void {
    const existing = registry.get(channel);
    if (!existing || existing.ownerId !== ownerId) return;
    try {
      existing.ws.close();
    } catch {
      /* ignore */
    }
    registry.delete(channel);
  },

  get(channel: Channel): WsLike | null {
    return registry.get(channel)?.ws ?? null;
  },

  async reconnect(channel: Channel, factory: () => WsLike): Promise<void> {
    if (reconnectInFlight.has(channel)) {
      return reconnectInFlight.get(channel)!;
    }
    const task = (async () => {
      recordWsReconnect();
      const entry = registry.get(channel);
      if (entry) {
        try {
          entry.ws.close();
        } catch {
          /* ignore */
        }
      }
      const ws = factory();
      if (entry) registry.set(channel, { ...entry, ws });
    })().finally(() => {
      reconnectInFlight.delete(channel);
    });
    reconnectInFlight.set(channel, task);
    return task;
  },

  recordSubscriptionDuplicate(): void {
    recordWsSubscriptionDuplicate();
  },

  size(): number {
    return registry.size;
  },

  isPaused(): boolean {
    return registryPaused;
  },
};

/** Track AppState for WS pause/resume coordination (notifications stay open in background). */
export function initWsRegistryLifecycle(): void {
  if (lifecycleStarted) return;
  lifecycleStarted = true;

  const { AppState } = require('react-native') as typeof import('react-native');
  AppState.addEventListener('change', (nextState) => {
    registryPaused = nextState === 'background';
  });
}

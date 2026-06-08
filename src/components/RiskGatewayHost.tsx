import { useEffect, useRef } from 'react';
import { buildAppWsUrl } from '@/src/config/wsBaseUrl';
import type { RiskRevisionMessage } from '@/src/types/risk';
import { useRiskSnapshot } from '@/src/hooks/useRiskSnapshot';
import { wsRegistry, bindWsOpenHandler } from '@/src/runtime/wsConnectionRegistry';

const OWNER_ID = 'risk-gateway';

/**
 * Single orchestrator: snapshot hydration, WS revision handling, and polling fallback.
 * Mount once when authenticated — do not split across tab screens.
 */
export function RiskGatewayHost(): null {
  const { onWsRevision } = useRiskSnapshot({ enabled: true });
  const onWsRevisionRef = useRef(onWsRevision);
  onWsRevisionRef.current = onWsRevision;

  useEffect(() => {
    const url = buildAppWsUrl();
    const ws = wsRegistry.acquire('risk', OWNER_ID, () => new WebSocket(url)) as WebSocket;

    bindWsOpenHandler(ws, () => {
      ws.send(JSON.stringify({ type: 'risk_subscribe' }));
    });

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data)) as RiskRevisionMessage;
        if (msg.channel === 'risk' && msg.type === 'risk:revision' && msg.payload?.revision) {
          onWsRevisionRef.current(msg.payload.revision);
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      ws.onopen = null;
      ws.onmessage = null;
      wsRegistry.release('risk', OWNER_ID);
    };
  }, []);

  return null;
}

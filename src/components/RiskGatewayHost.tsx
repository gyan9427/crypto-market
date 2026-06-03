import { useEffect, useRef } from 'react';
import { buildAppWsUrl } from '@/src/config/wsBaseUrl';
import type { RiskRevisionMessage } from '@/src/types/risk';
import { useRiskSnapshot } from '@/src/hooks/useRiskSnapshot';

/** Subscribes to risk:revision WS pings and keeps CRS snapshot revision-monotonic. */
export function RiskGatewayHost(): null {
  const { onWsRevision } = useRiskSnapshot({ enabled: true });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = buildAppWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'risk_subscribe' }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data)) as RiskRevisionMessage;
        if (msg.channel === 'risk' && msg.type === 'risk:revision' && msg.payload?.revision) {
          onWsRevision(msg.payload.revision);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [onWsRevision]);

  return null;
}

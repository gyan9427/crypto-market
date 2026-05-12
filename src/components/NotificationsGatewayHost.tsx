import { useNotificationsGateway } from '@/src/hooks/useNotificationsGateway';
import { useAuthStore } from '@/src/state/useAuthStore';

/** Keeps notification WS + REST reconciliation alive while authenticated. */
export function NotificationsGatewayHost(): null {
  const authed = useAuthStore((s) => s.isAuthenticated);
  useNotificationsGateway(authed);
  return null;
}

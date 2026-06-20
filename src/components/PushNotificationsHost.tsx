import { useAuthStore } from '@/src/state/useAuthStore';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

/** Registers device push token when user is authenticated. */
export function PushNotificationsHost() {
  const authed = useAuthStore((s) => s.isAuthenticated);
  const emailVerified = useAuthStore((s) => s.user?.emailVerified === true);
  usePushNotifications(authed && emailVerified);
  return null;
}

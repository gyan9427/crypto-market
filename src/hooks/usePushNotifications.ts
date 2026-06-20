import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/state/useAuthStore';
import { deviceSessionsApi } from '@/src/services/deviceSessionsApi';
import { navigateFromNotificationData } from '@/src/navigation/navigateFromNotificationData';
import { trackNotificationOpened } from '@/src/utils/trackEvent';
import {
  isRemotePushAvailable,
  loadExpoNotifications,
  type ExpoNotificationsModule,
} from '@/src/push/expoNotificationsLoader';

async function resolveDeviceId(): Promise<string> {
  if (Platform.OS === 'android' && Application.getAndroidId()) {
    return Application.getAndroidId();
  }
  if (Platform.OS === 'ios') {
    const iosId = await Application.getIosIdForVendorAsync();
    if (iosId) return iosId;
  }
  return Constants.installationId ?? `expo-${Date.now()}`;
}

export function usePushNotifications(enabled: boolean): void {
  const router = useRouter();
  const registeredRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isRemotePushAvailable()) {
      const prev = registeredRef.current;
      const deviceId = deviceIdRef.current;
      if (prev && deviceId) {
        void deviceSessionsApi.remove(deviceId).catch(() => {});
      }
      registeredRef.current = null;
      return;
    }

    let cancelled = false;
    let responseSub: { remove: () => void } | null = null;

    async function register(Notifications: ExpoNotificationsModule): Promise<void> {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted' || cancelled) return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn('[Push] Missing EAS projectId');
        return;
      }

      const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
      const pushToken = tokenResult.data;
      const deviceId = await resolveDeviceId();
      deviceIdRef.current = deviceId;

      if (cancelled || registeredRef.current === pushToken) return;

      await deviceSessionsApi.upsert({
        deviceId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        pushToken,
      });
      registeredRef.current = pushToken;
    }

    void (async () => {
      const Notifications = await loadExpoNotifications();
      if (!Notifications || cancelled) return;

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        const notificationId =
          typeof data?.notificationId === 'string' ? data.notificationId : 'unknown';
        trackNotificationOpened({
          notificationId,
          category: typeof data?.category === 'string' ? data.category : 'unknown',
          type: typeof data?.type === 'string' ? data.type : 'unknown',
          source: 'push',
        });
        navigateFromNotificationData(router, data);
      });

      await register(Notifications).catch((err) =>
        console.warn('[Push] registration failed', err)
      );
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
    };
  }, [enabled, router]);
}

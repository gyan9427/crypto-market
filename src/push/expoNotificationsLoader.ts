import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Remote push is not available in Expo Go on Android (SDK 53+).
 * Development/production builds (EAS) are required for Android push testing.
 */
export function isRemotePushAvailable(): boolean {
  if (Platform.OS === 'web') return false;

  const inExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';

  if (inExpoGo && Platform.OS === 'android') {
    return false;
  }

  return true;
}

export type ExpoNotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotificationsModule | null> | null = null;

/** Lazy-load expo-notifications so Expo Go on Android does not crash at bundle time. */
export async function loadExpoNotifications(): Promise<ExpoNotificationsModule | null> {
  if (!isRemotePushAvailable()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        return Notifications;
      } catch (err) {
        console.warn('[Push] expo-notifications unavailable in this environment', err);
        return null;
      }
    })();
  }

  return notificationsModulePromise;
}

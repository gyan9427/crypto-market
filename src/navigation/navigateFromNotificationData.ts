import type { useRouter } from 'expo-router';
import { navigateToCoin } from '@/src/navigation/coinNavigation';

type Router = ReturnType<typeof useRouter>;

export function navigateFromNotificationData(
  router: Router,
  data: Record<string, unknown> | undefined
): void {
  if (!data) {
    router.push('/(tabs)/notifications' as never);
    return;
  }

  const coinId = typeof data.coinId === 'string' ? data.coinId : undefined;
  if (coinId) {
    navigateToCoin(router, coinId);
    return;
  }

  const route = typeof data.route === 'string' ? data.route : undefined;
  if (route) {
    if (route.startsWith('/coin/')) {
      const id = route.replace(/^\/coin\//, '');
      if (id) {
        navigateToCoin(router, id);
        return;
      }
    }
    router.push(route as never);
    return;
  }

  router.push('/(tabs)/notifications' as never);
}

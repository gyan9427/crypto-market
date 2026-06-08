import type { Router } from 'expo-router';

/** Tab routes used when leaving coin detail via the header back button. */
export const COIN_RETURN_ROUTES = {
  home: '/(tabs)',
  market: '/(tabs)/market',
  portfolio: '/(tabs)/portfolio',
  profile: '/(tabs)/profile',
  search: '/(tabs)/search',
} as const;

export type CoinReturnTo = keyof typeof COIN_RETURN_ROUTES;

export function isCoinReturnTo(value: unknown): value is CoinReturnTo {
  return typeof value === 'string' && value in COIN_RETURN_ROUTES;
}

export function resolveCoinReturnRoute(returnTo: unknown): string | null {
  return isCoinReturnTo(returnTo) ? COIN_RETURN_ROUTES[returnTo] : null;
}

export function navigateToCoin(router: Router, coinId: string, returnTo?: CoinReturnTo): void {
  router.push({
    pathname: '/coin/[coinId]',
    params: returnTo ? { coinId, returnTo } : { coinId },
  } as never);
}

export function leaveCoinDetail(router: Router, returnTo: unknown): void {
  const route = resolveCoinReturnRoute(returnTo);
  if (route) {
    router.replace(route as never);
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(COIN_RETURN_ROUTES.market as never);
}

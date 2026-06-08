/** Rollout feature flags — each optimization isolated for rollback (default off until explicitly enabled). */

export function isTieredStartupEnabled(): boolean {
  return process.env.EXPO_PUBLIC_TIERED_STARTUP === 'true';
}

export function isFeedContextProviderEnabled(): boolean {
  return process.env.EXPO_PUBLIC_FEED_CONTEXT_PROVIDER === 'true';
}

export function isLazyRiskGatewayEnabled(): boolean {
  return process.env.EXPO_PUBLIC_LAZY_RISK_GATEWAY === 'true';
}

export function isWsRegistryEnabled(): boolean {
  return process.env.EXPO_PUBLIC_WS_REGISTRY === 'true';
}

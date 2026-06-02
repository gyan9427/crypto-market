import { useHasFeature } from '@/src/utils/features';
import { useAppStore } from '@/src/state/useAppStore';

const FEATURE_KEY = 'design_system_v2';
const DEV_OVERRIDE_KEY = 'designSystemV2Dev';

/**
 * Returns whether NAYFT design-system v2 primitives should be used.
 * Server feature flag `design_system_v2` or local dev override in app store.
 */
export function useDesignSystem(): { enabled: boolean; version: 1 | 2 } {
  const serverEnabled = useHasFeature(FEATURE_KEY);
  const devOverride = useAppStore((s) => s.designSystemV2Dev);
  const enabled = devOverride || serverEnabled;
  return { enabled, version: enabled ? 2 : 1 };
}

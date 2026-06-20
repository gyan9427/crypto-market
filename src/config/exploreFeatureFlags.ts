/** Explore sparkline performance flags — set EXPO_PUBLIC_EXPLORE_*=false to roll back. */

function envNotFalse(key: string): boolean {
  return process.env[key] !== 'false';
}

export function isExploreStableLoadLifecycleEnabled(): boolean {
  return envNotFalse('EXPO_PUBLIC_EXPLORE_STABLE_LOAD_LIFECYCLE');
}

export function isExploreReconcileRowsEnabled(): boolean {
  return envNotFalse('EXPO_PUBLIC_EXPLORE_RECONCILE_ROWS');
}

export function isExplorePreserveSparklinesEnabled(): boolean {
  return envNotFalse('EXPO_PUBLIC_EXPLORE_PRESERVE_SPARKLINES');
}

export function isExploreMemoOptimizationsEnabled(): boolean {
  return envNotFalse('EXPO_PUBLIC_EXPLORE_MEMO_OPTIMIZATIONS');
}

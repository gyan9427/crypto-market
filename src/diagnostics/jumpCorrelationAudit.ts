/**
 * Temporary jump-correlation diagnostics (__DEV__ only).
 * Remove after audit completes.
 */

export type JumpAuditCategory =
  | 'scroll'
  | 'gesture'
  | 'store'
  | 'render'
  | 'layout'
  | 'chart-recalc'
  | 'programmatic-scroll'
  | 'data-refresh'
  | 'animation'
  | 'virtualization';

export type JumpAuditEntry = {
  ts: number;
  wallMs: number;
  component: string;
  category: JumpAuditCategory;
  event: string;
  detail?: Record<string, unknown>;
};

const MAX_BUFFER = 4000;
const buffer: JumpAuditEntry[] = [];
let jumpCounter = 0;
let storeSubscribers: Record<string, number> = {
  marketSnapshot: 0,
  followingCoins: 0,
  newsReactions: 0,
  portfolio: 0,
};

function enabled(): boolean {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return false;
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_JUMP_AUDIT === '0') return false;
  return true;
}

export function isJumpAuditEnabled(): boolean {
  return enabled();
}

export function jumpAuditLog(
  component: string,
  category: JumpAuditCategory,
  event: string,
  detail?: Record<string, unknown>
): void {
  if (!enabled()) return;
  const entry: JumpAuditEntry = {
    ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    wallMs: Date.now(),
    component,
    category,
    event,
    detail,
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  // eslint-disable-next-line no-console
  console.log(`[jump-audit] ${JSON.stringify(entry)}`);
}

export function jumpAuditScroll(
  component: string,
  event: string,
  nativeEvent: { contentOffset?: { x?: number; y?: number }; velocity?: { x?: number; y?: number } },
  extra?: Record<string, unknown>
): void {
  jumpAuditLog(component, 'scroll', event, {
    offsetX: nativeEvent.contentOffset?.x ?? null,
    offsetY: nativeEvent.contentOffset?.y ?? null,
    velocityX: nativeEvent.velocity?.x ?? null,
    velocityY: nativeEvent.velocity?.y ?? null,
    ...extra,
  });
}

export function jumpAuditProgrammaticScroll(
  component: string,
  reason: string,
  targetOffset: number,
  currentOffset: number,
  extra?: Record<string, unknown>
): void {
  jumpAuditLog(component, 'programmatic-scroll', reason, {
    targetOffset,
    currentOffset,
    delta: targetOffset - currentOffset,
    ...extra,
  });
}

export function jumpAuditChartRecalc(
  component: string,
  event: string,
  detail: Record<string, unknown>
): void {
  jumpAuditLog(component, 'chart-recalc', event, detail);
}

export function jumpAuditLayout(
  component: string,
  event: string,
  oldSize: { width: number; height: number } | null,
  newSize: { width: number; height: number },
  extra?: Record<string, unknown>
): void {
  jumpAuditLog(component, 'layout', event, {
    oldWidth: oldSize?.width ?? null,
    oldHeight: oldSize?.height ?? null,
    newWidth: newSize.width,
    newHeight: newSize.height,
    widthDelta: oldSize ? newSize.width - oldSize.width : null,
    heightDelta: oldSize ? newSize.height - oldSize.height : null,
    ...extra,
  });
}

export function jumpAuditStore(
  storeKey: keyof typeof storeSubscribers,
  detail?: Record<string, unknown>
): void {
  jumpAuditLog('Zustand', 'store', storeKey, {
    subscriberHint: storeSubscribers[storeKey],
    ...detail,
  });
}

export function jumpAuditRegisterStoreSubscriber(storeKey: keyof typeof storeSubscribers): () => void {
  storeSubscribers[storeKey] = (storeSubscribers[storeKey] ?? 0) + 1;
  return () => {
    storeSubscribers[storeKey] = Math.max(0, storeSubscribers[storeKey] - 1);
  };
}

export function jumpAuditRender(
  component: string,
  detail: { why: string; changedProps?: string[]; changedState?: string[] }
): void {
  jumpAuditLog(component, 'render', 'render', detail);
}

export function jumpAuditVirtualization(
  component: string,
  event: 'mount' | 'unmount' | 'recycle',
  itemKey: string,
  index: number
): void {
  jumpAuditLog(component, 'virtualization', event, { itemKey, index });
}

export function jumpAuditMarkObserved(component: string, note?: string): number {
  jumpCounter += 1;
  const id = jumpCounter;
  jumpAuditLog(component, 'scroll', 'jump-observed', { jumpId: id, note });
  return id;
}

export function getJumpAuditBuffer(): readonly JumpAuditEntry[] {
  return buffer;
}

export function resetJumpAuditBuffer(): void {
  buffer.length = 0;
  jumpCounter = 0;
}

/** Build a 100ms window timeline ending at the last matching event. */
export function buildJumpCorrelationWindow(
  endEventMatch: (e: JumpAuditEntry) => boolean,
  windowMs = 100
): JumpAuditEntry[] {
  const endIdx = buffer.findLastIndex(endEventMatch);
  if (endIdx < 0) return [];
  const end = buffer[endIdx];
  return buffer.filter((e) => e.ts >= end.ts - windowMs && e.ts <= end.ts);
}

export function formatJumpCorrelationReport(entries: JumpAuditEntry[], jumpLabel: string): string {
  if (entries.length === 0) return `${jumpLabel}: no captured events`;
  const anchor = entries[entries.length - 1];
  const lines = entries.map((e) => {
    const dt = anchor.ts - e.ts;
    const label = dt === 0 ? 'T' : `T-${Math.round(dt)}ms`;
    return `${label}\n${e.category} | ${e.component} | ${e.event}${e.detail ? ` | ${JSON.stringify(e.detail)}` : ''}`;
  });
  return `${jumpLabel}\n\n${lines.join('\n\n')}`;
}

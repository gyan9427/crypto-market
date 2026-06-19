import { useCallback, useSyncExternalStore } from 'react';

/** 5-hour window at 5-minute resolution (60 points — lighter than 300×1m). */
export const SPARKLINE_WINDOW_HOURS = 5;
export const SPARKLINE_INTERVAL = '5m' as const;
export const SPARKLINE_MAX_POINTS = SPARKLINE_WINDOW_HOURS * 12;

const LIVE_BUCKET_MS = 60_000;

interface SparklineEntry {
  /** Mutable in-place — same reference kept for the lifetime of the symbol baseline. */
  prices: number[];
  baselineReady: boolean;
  lastBucketMs: number;
}

const entries = new Map<string, SparklineEntry>();
const versions = new Map<string, number>();
const listeners = new Map<string, Set<() => void>>();

let wsStreamHealthy = false;

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function bumpVersion(symbol: string): void {
  const upper = normalizeSymbol(symbol);
  versions.set(upper, (versions.get(upper) ?? 0) + 1);
  listeners.get(upper)?.forEach((cb) => cb());
}

export function setSparklineStreamHealthy(healthy: boolean): void {
  wsStreamHealthy = healthy;
}

export function isSparklineStreamHealthy(): boolean {
  return wsStreamHealthy;
}

export function isSparklineBaselineReady(symbol: string): boolean {
  const entry = entries.get(normalizeSymbol(symbol));
  return entry?.baselineReady === true && entry.prices.length >= 2;
}

export function getSparklineRevision(symbol: string): number {
  return versions.get(normalizeSymbol(symbol)) ?? 0;
}

export function getSparklinePrices(symbol: string): number[] {
  return entries.get(normalizeSymbol(symbol))?.prices ?? [];
}

function subscribeSymbol(symbol: string, cb: () => void): () => void {
  const upper = normalizeSymbol(symbol);
  let set = listeners.get(upper);
  if (!set) {
    set = new Set();
    listeners.set(upper, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
    if (set?.size === 0) listeners.delete(upper);
  };
}

/**
 * Initialize baseline from historical klines. Does not overwrite an existing baseline
 * (poll-safe; WS reconnect-safe).
 */
export function initSparklineBaseline(symbol: string, closes: number[]): boolean {
  const upper = normalizeSymbol(symbol);
  const finite = closes.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return false;

  const trimmed = finite.slice(-SPARKLINE_MAX_POINTS);
  const existing = entries.get(upper);
  if (existing?.baselineReady) {
    return true;
  }

  entries.set(upper, {
    prices: trimmed,
    baselineReady: true,
    lastBucketMs: Date.now(),
  });
  bumpVersion(upper);
  return true;
}

/**
 * Minimal baseline when historical klines are unavailable.
 * Uses a mutable two-point array so live WS ticks can append in-place.
 */
export function initSparklineFallback(symbol: string, price: number): boolean {
  const upper = normalizeSymbol(symbol);
  if (entries.get(upper)?.baselineReady) return true;

  const v = Number.isFinite(price) && price > 0 ? price : 0;
  entries.set(upper, {
    prices: [v, v],
    baselineReady: true,
    lastBucketMs: Date.now(),
  });
  bumpVersion(upper);
  return true;
}

/**
 * Append or update the latest live price in-place without rebuilding the array.
 * Drops the oldest point when the rolling window is full.
 */
export function appendSparklineLivePrice(symbol: string, price: number, ts = Date.now()): boolean {
  if (!Number.isFinite(price)) return false;
  const upper = normalizeSymbol(symbol);
  const entry = entries.get(upper);
  if (!entry || !entry.baselineReady) return false;

  const arr = entry.prices;
  const sameBucket = ts - entry.lastBucketMs < LIVE_BUCKET_MS;

  if (sameBucket && arr.length > 0) {
    if (arr[arr.length - 1] === price) return false;
    arr[arr.length - 1] = price;
  } else {
    if (arr.length >= SPARKLINE_MAX_POINTS) {
      arr.shift();
    }
    arr.push(price);
    entry.lastBucketMs = ts;
  }

  bumpVersion(upper);
  return true;
}

export function useSparklineRevision(symbol: string): number {
  const upper = normalizeSymbol(symbol);
  const subscribe = useCallback((cb: () => void) => subscribeSymbol(upper, cb), [upper]);
  const getRevision = useCallback(() => getSparklineRevision(upper), [upper]);
  return useSyncExternalStore(subscribe, getRevision, getRevision);
}

export function useSparklineHistory(symbol: string): number[] {
  const upper = normalizeSymbol(symbol);
  const revision = useSparklineRevision(upper);
  void revision;
  return getSparklinePrices(upper);
}

export function useSparklineBaselineReady(symbol: string): boolean {
  const upper = normalizeSymbol(symbol);
  const revision = useSparklineRevision(upper);
  void revision;
  return isSparklineBaselineReady(upper);
}

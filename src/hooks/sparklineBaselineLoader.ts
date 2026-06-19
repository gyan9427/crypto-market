import { fetchKlines } from '@/src/charts/services/chartApi';
import { toSparklineData } from '@/src/services/api';
import {
  initSparklineBaseline,
  initSparklineFallback,
  isSparklineBaselineReady,
  SPARKLINE_INTERVAL,
  SPARKLINE_MAX_POINTS,
} from './sparklineHistoryHub';

const PREFETCH_CONCURRENCY = 4;
const KLINES_TIMEOUT_MS = 12_000;

const inFlight = new Map<string, Promise<boolean>>();

export interface SparklineCoinRef {
  symbol: string;
  price?: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('sparkline klines timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function loadSparklineBaseline(symbol: string, fallbackPrice?: number): Promise<boolean> {
  const upper = symbol.trim().toUpperCase();
  if (isSparklineBaselineReady(upper)) return true;

  try {
    const klines = await withTimeout(
      fetchKlines({
        symbol: upper,
        interval: SPARKLINE_INTERVAL,
        limit: SPARKLINE_MAX_POINTS,
      }),
      KLINES_TIMEOUT_MS
    );
    const closes = toSparklineData(klines);
    if (closes.length >= 2) {
      return initSparklineBaseline(upper, closes);
    }
  } catch {
    // fall through to price fallback
  }

  return initSparklineFallback(upper, fallbackPrice ?? 0);
}

export async function ensureSparklineBaseline(
  symbol: string,
  fallbackPrice?: number
): Promise<boolean> {
  const upper = symbol.trim().toUpperCase();
  if (isSparklineBaselineReady(upper)) return true;

  let pending = inFlight.get(upper);
  if (!pending) {
    pending = loadSparklineBaseline(upper, fallbackPrice).finally(() => {
      inFlight.delete(upper);
    });
    inFlight.set(upper, pending);
  }
  return pending;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

export async function prefetchSparklineBaseline(
  symbol: string,
  fallbackPrice?: number
): Promise<boolean> {
  return ensureSparklineBaseline(symbol, fallbackPrice);
}

/** Load baselines in the background — never leaves a symbol without a fallback baseline. */
export async function prefetchSparklineBaselines(coins: SparklineCoinRef[]): Promise<void> {
  const seen = new Set<string>();
  const unique: SparklineCoinRef[] = [];
  for (const coin of coins) {
    const upper = coin.symbol.trim().toUpperCase();
    if (!upper || seen.has(upper)) continue;
    seen.add(upper);
    unique.push({ symbol: upper, price: coin.price });
  }

  await runWithConcurrency(unique, PREFETCH_CONCURRENCY, async (coin) => {
    await ensureSparklineBaseline(coin.symbol, coin.price);
  });
}

/** @deprecated Pass `{ symbol, price }[]` instead. */
export async function prefetchSparklineBaselinesBySymbol(symbols: string[]): Promise<void> {
  await prefetchSparklineBaselines(symbols.map((symbol) => ({ symbol })));
}

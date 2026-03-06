import type { KlineRecord } from '../types';

const PAD_RATIO = 0.05;

/**
 * Map price to Y coordinate (top = high price).
 * All functions are worklets for UI-thread execution.
 */
export function priceToY(
  price: number,
  priceMin: number,
  priceMax: number,
  areaHeight: number,
  topPad: number
): number {
  'worklet';
  const range = priceMax - priceMin;
  if (range <= 0) return areaHeight / 2;
  const paddedMin = priceMin - range * PAD_RATIO;
  const paddedMax = priceMax + range * PAD_RATIO;
  const paddedRange = paddedMax - paddedMin;
  if (paddedRange <= 0) return areaHeight / 2;
  const t = (price - paddedMin) / paddedRange;
  return topPad + (1 - t) * (areaHeight - topPad);
}

export function yToPrice(
  y: number,
  priceMin: number,
  priceMax: number,
  areaHeight: number,
  topPad: number
): number {
  'worklet';
  const range = priceMax - priceMin;
  if (range <= 0) return (priceMin + priceMax) / 2;
  const paddedMin = priceMin - range * PAD_RATIO;
  const paddedMax = priceMax + range * PAD_RATIO;
  const paddedRange = paddedMax - paddedMin;
  if (paddedRange <= 0) return (priceMin + priceMax) / 2;
  const t = 1 - (y - topPad) / (areaHeight - topPad);
  return paddedMin + t * paddedRange;
}

export function idxToX(
  idx: number,
  totalCandles: number,
  candleWidthPx: number,
  offsetPx: number,
  areaWidth: number
): number {
  'worklet';
  const rightEdge = totalCandles * candleWidthPx;
  const x = rightEdge - offsetPx - (totalCandles - 1 - idx) * candleWidthPx - candleWidthPx / 2;
  return x;
}

export function xToIdx(
  x: number,
  totalCandles: number,
  candleWidthPx: number,
  offsetPx: number,
  areaWidth: number
): number {
  'worklet';
  const rightEdge = totalCandles * candleWidthPx;
  const relX = rightEdge - offsetPx - x;
  const idx = Math.floor(relX / candleWidthPx);
  return Math.max(0, Math.min(totalCandles - 1, idx));
}

export function getVisibleRange(
  totalCandles: number,
  candleWidthPx: number,
  offsetPx: number,
  areaWidth: number
): [number, number] {
  'worklet';
  if (totalCandles <= 0) return [0, 0];
  const rightEdge = totalCandles * candleWidthPx;
  const leftVisible = Math.max(0, rightEdge - offsetPx - areaWidth);
  const rightVisible = rightEdge - offsetPx;
  const startIdx = Math.max(0, Math.floor(leftVisible / candleWidthPx));
  const endIdx = Math.min(totalCandles - 1, Math.ceil(rightVisible / candleWidthPx));
  return [startIdx, endIdx];
}

export function getVisiblePriceRange(
  candles: KlineRecord[],
  startIdx: number,
  endIdx: number
): [number, number] {
  if (!candles || candles.length === 0 || startIdx > endIdx) return [0, 0];
  let min = Infinity;
  let max = -Infinity;
  for (let i = startIdx; i <= endIdx; i++) {
    const c = candles[i];
    if (!c) continue;
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 0;
  return [min, max];
}

/**
 * Technical indicator computations for Lightweight Charts.
 * These formulas are mirrored in the WebView chart script (chartTemplate.ts).
 */

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function sma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[i - j];
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let prevEma: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      if (prevEma === null) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += values[j];
        prevEma = sum / period;
      } else {
        prevEma = values[i] * k + prevEma * (1 - k);
      }
      result.push(prevEma);
    }
  }
  return result;
}

export function rsi(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      let gains = 0;
      let losses = 0;
      for (let j = 1; j <= period; j++) {
        const diff = closes[i - j + 1] - closes[i - j];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - 100 / (1 + rs));
      }
    }
  }
  return result;
}

export function vwap(ohlcv: OHLCV[]): number[] {
  let cumVol = 0;
  let cumPV = 0;
  const result: number[] = [];
  for (const bar of ohlcv) {
    const typical = (bar.high + bar.low + bar.close) / 3;
    cumPV += typical * bar.volume;
    cumVol += bar.volume;
    result.push(cumVol === 0 ? bar.close : cumPV / cumVol);
  }
  return result;
}

export function volumeMA(volumes: number[], period: number): (number | null)[] {
  return sma(volumes, period);
}

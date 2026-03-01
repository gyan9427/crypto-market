import { format } from 'date-fns';
import type { ChartDataPoint, KlineRecord } from './types';

type ValueKey = 'close' | 'open' | 'high' | 'low';

export function klinesToLineData(
  klines: KlineRecord[],
  valueKey: ValueKey = 'close',
  interval: string = '1h'
): ChartDataPoint[] {
  const labelEvery =
    interval === '1m'
      ? Math.max(1, Math.floor(klines.length / 6))
      : interval === '5m'
        ? Math.max(1, Math.floor(klines.length / 8))
        : Math.max(1, Math.floor(klines.length / 10));

  return klines.map((k, idx) => {
    const value = k[valueKey];
    const openTime = typeof k.openTime === 'string' ? new Date(k.openTime) : k.openTime;
    return {
      value,
      // Avoid large text payload per point for dense datasets (e.g. 1m).
      label: idx % labelEvery === 0 ? formatXLabel(openTime, interval) : '',
    };
  });
}

export function formatXLabel(openTime: Date, interval: string): string {
  switch (interval) {
    case '1m':
      return format(openTime, 'HH:mm');
    case '5m':
      return format(openTime, 'HH:mm');
    case '1h':
      return format(openTime, 'MMM d');
    case '1d':
    case '1w':
      return format(openTime, 'MMM d');
    default:
      return format(openTime, 'MMM d');
  }
}

/** Lightweight Charts candlestick data point */
export interface LWCandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Lightweight Charts volume data point */
export interface LWVolumeData {
  time: string;
  value: number;
  color: string;
}

/** Convert KlineRecord[] to Lightweight Charts format. Uses Unix timestamp for intraday, YYYY-MM-DD for daily+. */
export function klinesToLWChartData(
  klines: KlineRecord[],
  interval: string
): { candlestick: LWCandlestickData[]; volume: LWVolumeData[] } {
  const candlestick: LWCandlestickData[] = [];
  const volume: LWVolumeData[] = [];
  const isIntraday = interval === '1m' || interval === '5m' || interval === '1h';

  for (const k of klines) {
    const openTime = typeof k.openTime === 'string' ? new Date(k.openTime) : k.openTime;
    const time = isIntraday
      ? String(Math.floor(openTime.getTime() / 1000))
      : format(openTime, 'yyyy-MM-dd');
    candlestick.push({
      time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    });
    volume.push({
      time,
      value: k.volume,
      color: k.close >= k.open ? '#22c55e' : '#ef4444',
    });
  }

  return { candlestick, volume };
}

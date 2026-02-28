import { format } from 'date-fns';
import { formatPrice } from '../utils/format';
import type { ChartDataPoint, KlineRecord } from './types';

type ValueKey = 'close' | 'open' | 'high' | 'low';

export function klinesToLineData(
  klines: KlineRecord[],
  valueKey: ValueKey = 'close',
  interval: string = '1h'
): ChartDataPoint[] {
  return klines.map((k) => {
    const value = k[valueKey];
    const openTime = typeof k.openTime === 'string' ? new Date(k.openTime) : k.openTime;
    return {
      value,
      dataPointText: formatPrice(value),
      label: formatXLabel(openTime, interval),
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
      return format(openTime, 'MMM d');
    default:
      return format(openTime, 'MMM d');
  }
}

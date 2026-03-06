import type { KlineInterval } from '../types';

export function formatPrice(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  if (v >= 1) return v.toFixed(2);
  if (v >= 0.01) return v.toFixed(4);
  return v.toFixed(6);
}

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toFixed(0);
}

function toTimestamp(ts: number | Date | string): number {
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  return new Date(ts).getTime();
}

export function formatTime(ts: number | Date | string, interval: KlineInterval): string {
  const t = toTimestamp(ts);
  const d = new Date(t);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const day = d.getDate();
  const month = d.toLocaleString('en', { month: 'short' });
  const year = d.getFullYear();

  if (interval === '1m' || interval === '5m') {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  if (interval === '1h') {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

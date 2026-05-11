export const colors = {
  background: {
    primary: '#0E0E12',
    secondary: '#16161C',
    tertiary: '#1E1E26',
    elevated: '#16161C',
  },
  text: {
    primary: '#F0F0F0',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  accent: {
    positive: '#22C55E',
    negative: '#EF4444',
    positiveSubtle: 'rgba(34,197,94,0.12)',
    negativeSubtle: 'rgba(239,68,68,0.12)',
  },
  chart: {
    linePositive: '#22C55E',
    lineNegative: '#EF4444',
    grid: 'rgba(255,255,255,0.04)',
    crosshair: 'rgba(255,255,255,0.40)',
    reference: 'rgba(255,255,255,0.20)',
    separator: 'rgba(255,255,255,0.08)',
  },
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
  },
} as const;

export type Colors = typeof colors;

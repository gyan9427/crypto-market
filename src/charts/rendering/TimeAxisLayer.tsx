import React, { useMemo } from 'react';
import { Group, Text, matchFont } from '@shopify/react-native-skia';
import { idxToX } from '../services/chartLayout';
import { formatTime } from '../services/chartFormat';
import type { KlineRecord, KlineInterval } from '../types';

const AXIS_COLOR = '#64748b';
const FONT_SIZE = 10;
const MIN_LABEL_SPACING_PX = 44;

// Module-level font — avoids first-render flash, fixes Android monospace fallback (P0-17)
const AXIS_FONT = (() => {
  try {
    return matchFont({ familyName: 'System', fontSize: FONT_SIZE, fontStyle: 'normal', fontWeight: 'normal' });
  } catch {
    return null;
  }
})();

export interface TimeAxisLayerProps {
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  visibleStartIdx: number;
  visibleEndIdx: number;
  interval: KlineInterval;
  priceAreaHeight: number;
  volumeAreaHeight: number;
  candleWidthPx: number;
  offsetPx: number;
  totalCandles: number;
  areaWidth: number;
}

export function TimeAxisLayer(props: TimeAxisLayerProps) {
  const {
    candles,
    liveCandle,
    visibleStartIdx,
    visibleEndIdx,
    interval,
    priceAreaHeight,
    volumeAreaHeight,
    candleWidthPx,
    offsetPx,
    totalCandles,
    areaWidth,
  } = props;

  const ticks = useMemo(() => {
    const result: { x: number; label: string }[] = [];
    const lastIdx = candles.length - 1;
    const tickStep = Math.max(1, Math.floor((visibleEndIdx - visibleStartIdx + 1) / 6));

    let lastRenderedX = -Infinity;

    for (let i = visibleStartIdx; i <= visibleEndIdx; i += tickStep) {
      const c = i === lastIdx && liveCandle ? liveCandle : candles[i];
      if (!c) continue;
      const x = idxToX(i, totalCandles, candleWidthPx, offsetPx, areaWidth);
      // P0-8: skip if too close to the previous rendered label
      if (x - lastRenderedX < MIN_LABEL_SPACING_PX) continue;
      lastRenderedX = x;
      result.push({ x, label: formatTime(c.openTime, interval) });
    }
    return result;
  }, [
    candles,
    liveCandle,
    visibleStartIdx,
    visibleEndIdx,
    interval,
    candleWidthPx,
    offsetPx,
    totalCandles,
    areaWidth,
  ]);

  const baseY = priceAreaHeight + volumeAreaHeight + FONT_SIZE;

  if (!AXIS_FONT) return <Group />;

  return (
    <Group>
      {ticks.map(({ x, label }, i) => (
        <Text key={i} x={x - 20} y={baseY} text={label} font={AXIS_FONT} color={AXIS_COLOR} />
      ))}
    </Group>
  );
}

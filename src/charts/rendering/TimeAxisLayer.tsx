import React, { useMemo, useState, useEffect } from 'react';
import { Group, Text, matchFont } from '@shopify/react-native-skia';
import { idxToX } from '../services/chartLayout';
import { formatTime } from '../services/chartFormat';
import type { KlineRecord, KlineInterval } from '../types';

const AXIS_COLOR = '#64748b';
const FONT_SIZE = 10;

function getFont() {
  try {
    return matchFont({ fontSize: FONT_SIZE });
  } catch {
    return null;
  }
}

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
  const font = useMemo(() => getFont(), []);
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
    const rightEdge = totalCandles * candleWidthPx;
    const startX = Math.max(0, rightEdge - offsetPx - areaWidth);
    const endX = rightEdge - offsetPx;
    const baseY = priceAreaHeight + volumeAreaHeight + FONT_SIZE / 2;

    for (let i = visibleStartIdx; i <= visibleEndIdx; i += tickStep) {
      const c = i === lastIdx && liveCandle ? liveCandle : candles[i];
      if (!c) continue;
      const x = idxToX(i, totalCandles, candleWidthPx, offsetPx, areaWidth);
      if (x >= startX && x <= endX) {
        result.push({
          x,
          label: formatTime(c.openTime, interval),
        });
      }
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

  if (!font) {
    return <Group />;
  }

  return (
    <Group>
      {ticks.map(({ x, label }, i) => (
        <Text
          key={i}
          x={x - 20}
          y={baseY}
          text={label}
          font={font}
          color={AXIS_COLOR}
        />
      ))}
    </Group>
  );
}

import React from 'react';
import {
  Group,
  Path,
  RoundedRect,
  Skia,
  Text,
  matchFont,
} from '@shopify/react-native-skia';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { useState } from 'react';
import type { KlineRecord } from '../types';
import { formatPrice, formatVolume, formatTime } from '../services/chartFormat';
import type { KlineInterval } from '../types';
import { priceToY } from '../services/chartLayout';
import { useChartUi } from '../ChartUiContext';

// Module-level font — avoids flash on first render, fixes Android monospace fallback
const FONT_SIZE = 10;
const AXIS_FONT = (() => {
  try {
    return matchFont({ familyName: 'System', fontSize: FONT_SIZE, fontStyle: 'normal', fontWeight: 'normal' });
  } catch {
    return null;
  }
})();

export interface CrosshairLayerProps {
  crosshairX: { value: number };
  crosshairY: { value: number };
  crosshairIdx: { value: number };
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  interval: KlineInterval;
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  volumeAreaHeight: number;
  areaWidth: number;
  areaHeight: number;
}

export function CrosshairLayer(props: CrosshairLayerProps) {
  const palette = useChartUi();
  const {
    crosshairX,
    crosshairY,
    crosshairIdx,
    candles,
    liveCandle,
    interval,
    priceMin,
    priceMax,
    priceAreaHeight,
    areaWidth,
    areaHeight,
  } = props;

  const [state, setState] = useState({ x: -1, y: -1, idx: -1 });
  useAnimatedReaction(
    () => ({ x: crosshairX.value, y: crosshairY.value, idx: crosshairIdx.value }),
    (v) => runOnJS(setState)(v)
  );

  const { x, idx } = state;
  const visible = x >= 0;
  const candle =
    idx >= 0 && idx < candles.length
      ? idx === candles.length - 1 && liveCandle
        ? liveCandle
        : candles[idx]
      : null;

  // Snap horizontal line to candle close price — not to raw tap Y
  const snappedY = candle
    ? priceToY(candle.close, priceMin, priceMax, priceAreaHeight, 0)
    : state.y;

  const verticalPath = React.useMemo(() => {
    if (!visible) return Skia.Path.Make();
    const p = Skia.Path.Make();
    p.moveTo(x, 0);
    p.lineTo(x, priceAreaHeight);
    return p;
  }, [visible, x, priceAreaHeight]);

  const horizontalPath = React.useMemo(() => {
    if (!visible) return Skia.Path.Make();
    const p = Skia.Path.Make();
    p.moveTo(0, snappedY);
    p.lineTo(areaWidth, snappedY);
    return p;
  }, [visible, snappedY, areaWidth]);

  if (!visible) return null;

  const tooltipW = 140;
  const tooltipH = candle?.tradeCount != null ? 110 : 90;
  const tooltipX = x > areaWidth - tooltipW - 20 ? x - tooltipW - 10 : x + 10;
  const tooltipY = Math.max(0, Math.min(snappedY - tooltipH / 2, areaHeight - tooltipH));

  return (
    <Group>
      {/* Vertical crosshair — solid */}
      <Path path={verticalPath} style="stroke" strokeWidth={0.5} color={palette.crosshair} />
      {/* Horizontal crosshair — dashed, snapped to candle close */}
      <Path
        path={horizontalPath}
        style="stroke"
        strokeWidth={0.5}
        color={palette.crosshair}
        strokeCap="round"
      />
      {candle && AXIS_FONT && (
        <Group>
          <RoundedRect
            x={tooltipX}
            y={tooltipY}
            width={tooltipW}
            height={tooltipH}
            r={6}
            color={palette.tooltipBg}
          />
          <Text
            x={tooltipX + 8}
            y={tooltipY + 14}
            text={formatTime(candle.openTime, interval)}
            font={AXIS_FONT}
            color={palette.tooltipTextSecondary}
          />
          <Text
            x={tooltipX + 8}
            y={tooltipY + 28}
            text={`O ${formatPrice(candle.open)}  H ${formatPrice(candle.high)}`}
            font={AXIS_FONT}
            color={palette.tooltipTextPrimary}
          />
          <Text
            x={tooltipX + 8}
            y={tooltipY + 42}
            text={`L ${formatPrice(candle.low)}  C ${formatPrice(candle.close)}`}
            font={AXIS_FONT}
            color={palette.tooltipTextPrimary}
          />
          <Text
            x={tooltipX + 8}
            y={tooltipY + 56}
            text={`V ${formatVolume(candle.volume)}`}
            font={AXIS_FONT}
            color={palette.tooltipTextSecondary}
          />
          {candle.tradeCount != null && (
            <Text
              x={tooltipX + 8}
              y={tooltipY + 70}
              text={`Trades ${candle.tradeCount}`}
              font={AXIS_FONT}
              color={palette.tooltipTextSecondary}
            />
          )}
        </Group>
      )}
    </Group>
  );
}

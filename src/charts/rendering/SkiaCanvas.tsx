import React, { useMemo } from 'react';
import { Canvas, Group } from '@shopify/react-native-skia';
import type { KlineRecord, KlineInterval } from '../types';
import { getVisiblePriceRange } from '../services/chartLayout';
import {
  PRICE_AXIS_WIDTH,
  TIME_AXIS_HEIGHT,
  VOLUME_RATIO,
} from '../constants';
import { GridLayer } from './GridLayer';
import { CandlestickLayer } from './CandlestickLayer';
import { VolumeLayer } from './VolumeLayer';
import { PriceAxisLayer } from './PriceAxisLayer';
import { TimeAxisLayer } from './TimeAxisLayer';
import { CrosshairLayer } from './CrosshairLayer';
import type { ChartViewport } from '../hooks/useChartViewport';
import type { CrosshairState } from '../hooks/useCrosshair';

export interface ViewportState {
  visibleStartIdx: number;
  visibleEndIdx: number;
  candleWidthPx: number;
  offsetPx: number;
}

export interface SkiaCanvasProps {
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  viewport: ChartViewport;
  viewportState: ViewportState;
  crosshair: CrosshairState;
  interval: KlineInterval;
  width: number;
  height: number;
}

export function SkiaCanvas(props: SkiaCanvasProps) {
  const { candles, liveCandle, viewport, viewportState, crosshair, interval, width, height } = props;

  const areaWidth = Math.max(0, width - PRICE_AXIS_WIDTH);
  const chartHeight = Math.max(0, height - TIME_AXIS_HEIGHT);
  const volumeAreaHeight = chartHeight * VOLUME_RATIO;
  const priceAreaHeight = chartHeight - volumeAreaHeight;
  const topPad = 0;

  const { visibleStartIdx, visibleEndIdx, candleWidthPx, offsetPx } = viewportState;
  const totalCandles = candles.length;

  const [priceMin, priceMax] = useMemo(() => {
    if (candles.length === 0) return [0, 0];
    return getVisiblePriceRange(candles, visibleStartIdx, visibleEndIdx);
  }, [candles, visibleStartIdx, visibleEndIdx]);

  const gridProps = {
    priceMin,
    priceMax,
    areaWidth,
    priceAreaHeight,
    volumeAreaHeight,
    topPad,
    candles,
    visibleStartIdx,
    visibleEndIdx,
    candleWidthPx,
    offsetPx,
    totalCandles,
  };

  const candleProps = {
    ...gridProps,
    liveCandle,
  };

  const volumeProps = {
    candles,
    liveCandle,
    visibleStartIdx,
    visibleEndIdx,
    volumeAreaHeight,
    priceAreaHeight,
    candleWidthPx,
    offsetPx,
    totalCandles,
    areaWidth,
  };

  const priceAxisProps = {
    priceMin,
    priceMax,
    priceAreaHeight,
    topPad,
    areaWidth,
  };

  const timeAxisProps = {
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
  };

  const crosshairProps = {
    crosshairX: crosshair.crosshairX,
    crosshairY: crosshair.crosshairY,
    crosshairIdx: crosshair.crosshairIdx,
    candles,
    liveCandle,
    interval,
    priceAreaHeight,
    volumeAreaHeight,
    areaWidth,
    areaHeight: chartHeight,
  };

  return (
    <Canvas style={{ flex: 1, width, height }}>
      <Group>
        <GridLayer {...gridProps} />
        <CandlestickLayer {...candleProps} />
        <VolumeLayer {...volumeProps} />
        <PriceAxisLayer {...priceAxisProps} />
        <TimeAxisLayer {...timeAxisProps} />
        <CrosshairLayer {...crosshairProps} />
      </Group>
    </Canvas>
  );
}

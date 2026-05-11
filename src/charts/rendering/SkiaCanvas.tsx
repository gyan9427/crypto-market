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
import { ReferencePriceLayer } from './ReferencePriceLayer';
import { LastPriceLayer } from './LastPriceLayer';
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

function SkiaCanvasInner(props: SkiaCanvasProps) {
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

  const sessionOpenPrice = candles.length > 0 ? candles[0].open : 0;
  const lastClose = liveCandle?.close ?? (candles.length > 0 ? candles[candles.length - 1].close : 0);

  const sharedProps = {
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

  return (
    <Canvas style={{ flex: 1, width, height }}>
      <Group>
        <GridLayer {...sharedProps} />
        <ReferencePriceLayer
          sessionOpenPrice={sessionOpenPrice}
          priceMin={priceMin}
          priceMax={priceMax}
          priceAreaHeight={priceAreaHeight}
          topPad={topPad}
          areaWidth={areaWidth}
        />
        <CandlestickLayer {...sharedProps} liveCandle={liveCandle} />
        <VolumeLayer
          candles={candles}
          liveCandle={liveCandle}
          visibleStartIdx={visibleStartIdx}
          visibleEndIdx={visibleEndIdx}
          volumeAreaHeight={volumeAreaHeight}
          priceAreaHeight={priceAreaHeight}
          candleWidthPx={candleWidthPx}
          offsetPx={offsetPx}
          totalCandles={totalCandles}
          areaWidth={areaWidth}
        />
        <PriceAxisLayer
          priceMin={priceMin}
          priceMax={priceMax}
          priceAreaHeight={priceAreaHeight}
          topPad={topPad}
          areaWidth={areaWidth}
        />
        <TimeAxisLayer
          candles={candles}
          liveCandle={liveCandle}
          visibleStartIdx={visibleStartIdx}
          visibleEndIdx={visibleEndIdx}
          interval={interval}
          priceAreaHeight={priceAreaHeight}
          volumeAreaHeight={volumeAreaHeight}
          candleWidthPx={candleWidthPx}
          offsetPx={offsetPx}
          totalCandles={totalCandles}
          areaWidth={areaWidth}
        />
        <LastPriceLayer
          lastClose={lastClose}
          firstOpen={sessionOpenPrice}
          priceMin={priceMin}
          priceMax={priceMax}
          priceAreaHeight={priceAreaHeight}
          topPad={topPad}
          areaWidth={areaWidth}
        />
        <CrosshairLayer
          crosshairX={crosshair.crosshairX}
          crosshairY={crosshair.crosshairY}
          crosshairIdx={crosshair.crosshairIdx}
          candles={candles}
          liveCandle={liveCandle}
          interval={interval}
          priceMin={priceMin}
          priceMax={priceMax}
          priceAreaHeight={priceAreaHeight}
          volumeAreaHeight={volumeAreaHeight}
          areaWidth={areaWidth}
          areaHeight={chartHeight}
        />
      </Group>
    </Canvas>
  );
}

export const SkiaCanvas = React.memo(SkiaCanvasInner);

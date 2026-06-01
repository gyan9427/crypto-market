import React, { useMemo } from 'react';
import { Canvas, Group, Skia } from '@shopify/react-native-skia';
import type { KlineRecord, KlineInterval } from '../types';
import { getVisiblePriceRange } from '../services/chartLayout';
import {
  PRICE_AXIS_WIDTH,
  TIME_AXIS_HEIGHT,
  VOLUME_RATIO,
  CHART_H_PAD,
} from '../constants';
import { GridLayer } from './GridLayer';
import { CandlestickLayer } from './CandlestickLayer';
import { VolumeLayer } from './VolumeLayer';
import { PriceAxisLayer } from './PriceAxisLayer';
import { TimeAxisLayer } from './TimeAxisLayer';
import { CrosshairLayer } from './CrosshairLayer';
import { ReferencePriceLayer } from './ReferencePriceLayer';
import { LastPriceLayer } from './LastPriceLayer';
import { IndicatorLayer } from './IndicatorLayer';
import type { IndicatorLine } from './IndicatorLayer';
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
  indicatorLines?: IndicatorLine[];
}

function SkiaCanvasInner(props: SkiaCanvasProps) {
  const {
    candles,
    liveCandle,
    viewport,
    viewportState,
    crosshair,
    interval,
    width,
    height,
    indicatorLines,
  } = props;

  const areaWidth = Math.max(0, width - PRICE_AXIS_WIDTH);
  const chartHeight = Math.max(0, height - TIME_AXIS_HEIGHT);
  const volumeAreaHeight = chartHeight * VOLUME_RATIO;
  const priceAreaHeight = chartHeight - volumeAreaHeight;
  const topPad = 0;

  // Drawing width inset by horizontal padding on each side so candles never clip the edge
  const drawWidth = Math.max(0, areaWidth - CHART_H_PAD * 2);

  const { visibleStartIdx, visibleEndIdx, candleWidthPx, offsetPx } = viewportState;
  const totalCandles = candles.length;

  // Issue 6: include liveCandle high/low when it is in the visible window
  const [priceMin, priceMax] = useMemo(() => {
    if (candles.length === 0) return [0, 0];
    const [min, max] = getVisiblePriceRange(candles, visibleStartIdx, visibleEndIdx);
    if (liveCandle && visibleEndIdx >= candles.length - 1) {
      return [Math.min(min, liveCandle.low), Math.max(max, liveCandle.high)];
    }
    return [min, max];
  }, [candles, visibleStartIdx, visibleEndIdx, liveCandle]);

  const sessionOpenPrice = candles.length > 0 ? candles[0].open : 0;
  const lastClose = liveCandle?.close ?? (candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Issue 2: hard-clip the chart content area (candles + volume) above the time axis
  const chartClip = useMemo(
    () => Skia.XYWHRect(0, 0, areaWidth, priceAreaHeight + volumeAreaHeight),
    [areaWidth, priceAreaHeight, volumeAreaHeight]
  );

  const sharedProps = {
    priceMin,
    priceMax,
    areaWidth: drawWidth,
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
        {/* Grid uses drawWidth so vertical lines stay within the padded candle area */}
        <GridLayer {...sharedProps} />
        <ReferencePriceLayer
          sessionOpenPrice={sessionOpenPrice}
          priceMin={priceMin}
          priceMax={priceMax}
          priceAreaHeight={priceAreaHeight}
          topPad={topPad}
          areaWidth={areaWidth}
        />
        {/* Issue 8: Volume renders BEFORE candles (behind them) — correct z-order */}
        {/* Issue 2: clip group confines all chart drawing above the time axis */}
        <Group clip={chartClip}>
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
            areaWidth={drawWidth}
          />
          <CandlestickLayer {...sharedProps} liveCandle={liveCandle} />
        </Group>
        {/* Issue 14: indicator overlay — above candles, below crosshair */}
        <IndicatorLayer lines={indicatorLines ?? []} />
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
          areaWidth={drawWidth}
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

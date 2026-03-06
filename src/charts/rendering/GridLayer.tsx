import React from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import { priceToY } from '../services/chartLayout';
import type { KlineRecord } from '../types';

const GRID_OPACITY = 0.12;
const STROKE_WIDTH = 0.5;

export interface GridLayerProps {
  priceMin: number;
  priceMax: number;
  areaWidth: number;
  priceAreaHeight: number;
  volumeAreaHeight: number;
  topPad: number;
  candles: KlineRecord[];
  visibleStartIdx: number;
  visibleEndIdx: number;
  candleWidthPx: number;
  offsetPx: number;
  totalCandles: number;
}

function buildGridPaths(props: GridLayerProps) {
  const {
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
  } = props;

  const range = priceMax - priceMin || 1;
  const paddedMin = priceMin - range * 0.05;
  const paddedMax = priceMax + range * 0.05;
  const paddedRange = paddedMax - paddedMin || 1;

  const horizontalPath = Skia.Path.Make();
  const verticalPath = Skia.Path.Make();

  for (let i = 0; i <= 5; i++) {
    const price = paddedMin + (paddedRange * i) / 5;
    const y = priceToY(price, priceMin, priceMax, priceAreaHeight, topPad);
    horizontalPath.moveTo(0, y);
    horizontalPath.lineTo(areaWidth, y);
  }

  const rightEdge = totalCandles * candleWidthPx;
  const startX = Math.max(0, rightEdge - offsetPx - areaWidth);
  const endX = rightEdge - offsetPx;
  const tickStep = Math.max(1, Math.floor((visibleEndIdx - visibleStartIdx + 1) / 6));
  for (let idx = visibleStartIdx; idx <= visibleEndIdx; idx += tickStep) {
    const x = rightEdge - offsetPx - (totalCandles - 1 - idx) * candleWidthPx - candleWidthPx / 2;
    if (x >= startX && x <= endX) {
      verticalPath.moveTo(x, 0);
      verticalPath.lineTo(x, priceAreaHeight);
    }
  }

  return { horizontalPath, verticalPath };
}

export function GridLayer(props: GridLayerProps) {
  const { horizontalPath, verticalPath } = React.useMemo(
    () => buildGridPaths(props),
    [
      props.priceMin,
      props.priceMax,
      props.areaWidth,
      props.priceAreaHeight,
      props.topPad,
      props.visibleStartIdx,
      props.visibleEndIdx,
      props.candleWidthPx,
      props.offsetPx,
      props.totalCandles,
    ]
  );

  return (
    <>
      <Path
        path={horizontalPath}
        style="stroke"
        strokeWidth={STROKE_WIDTH}
        color={`rgba(128,128,128,${GRID_OPACITY})`}
      />
      <Path
        path={verticalPath}
        style="stroke"
        strokeWidth={STROKE_WIDTH}
        color={`rgba(128,128,128,${GRID_OPACITY})`}
      />
    </>
  );
}

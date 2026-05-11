import React, { useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { KlineRecord } from '../types';
import { priceToY, idxToX } from '../services/chartLayout';
import { CANDLE_BODY_RATIO } from '../constants';
import { useChartUi } from '../ChartUiContext';

export interface CandlestickLayerProps {
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  visibleStartIdx: number;
  visibleEndIdx: number;
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  topPad: number;
  candleWidthPx: number;
  offsetPx: number;
  totalCandles: number;
  areaWidth: number;
}

function buildCandlePaths(props: CandlestickLayerProps) {
  const {
    candles,
    liveCandle,
    visibleStartIdx,
    visibleEndIdx,
    priceMin,
    priceMax,
    priceAreaHeight,
    topPad,
    candleWidthPx,
    offsetPx,
    totalCandles,
    areaWidth,
  } = props;

  const bullPath = Skia.Path.Make();
  const bearPath = Skia.Path.Make();
  const bullWickPath = Skia.Path.Make();
  const bearWickPath = Skia.Path.Make();

  const bodyWidth = candleWidthPx * CANDLE_BODY_RATIO;
  const halfBody = bodyWidth / 2;

  const drawCandle = (c: KlineRecord, idx: number) => {
    const x = idxToX(idx, totalCandles, candleWidthPx, offsetPx, areaWidth);
    const wickTop = priceToY(c.high, priceMin, priceMax, priceAreaHeight, topPad);
    const wickBottom = priceToY(c.low, priceMin, priceMax, priceAreaHeight, topPad);
    const bodyTop = priceToY(Math.max(c.open, c.close), priceMin, priceMax, priceAreaHeight, topPad);
    const bodyBottom = priceToY(Math.min(c.open, c.close), priceMin, priceMax, priceAreaHeight, topPad);
    const bodyH = Math.max(1, Math.abs(bodyBottom - bodyTop));
    const isBull = c.close >= c.open;

    if (isBull) {
      bullWickPath.moveTo(x, wickTop);
      bullWickPath.lineTo(x, wickBottom);
      bullPath.addRect(Skia.XYWHRect(x - halfBody, bodyTop, bodyWidth, bodyH));
    } else {
      bearWickPath.moveTo(x, wickTop);
      bearWickPath.lineTo(x, wickBottom);
      bearPath.addRect(Skia.XYWHRect(x - halfBody, bodyTop, bodyWidth, bodyH));
    }
  };

  const lastIdx = candles.length - 1;
  for (let i = visibleStartIdx; i <= visibleEndIdx; i++) {
    const c = i === lastIdx && liveCandle ? liveCandle : candles[i];
    if (c) drawCandle(c, i);
  }

  return { bullPath, bearPath, bullWickPath, bearWickPath };
}

export function CandlestickLayer(props: CandlestickLayerProps) {
  const { linePositive: bullColor, lineNegative: bearColor } = useChartUi();
  const paths = useMemo(() => buildCandlePaths(props), [
    props.candles,
    props.liveCandle,
    props.visibleStartIdx,
    props.visibleEndIdx,
    props.priceMin,
    props.priceMax,
    props.priceAreaHeight,
    props.topPad,
    props.candleWidthPx,
    props.offsetPx,
    props.totalCandles,
    props.areaWidth,
  ]);

  return (
    <>
      <Path path={paths.bullWickPath} style="stroke" strokeWidth={1} color={bullColor} />
      <Path path={paths.bearWickPath} style="stroke" strokeWidth={1} color={bearColor} />
      <Path path={paths.bullPath} color={bullColor} />
      <Path path={paths.bearPath} color={bearColor} />
    </>
  );
}

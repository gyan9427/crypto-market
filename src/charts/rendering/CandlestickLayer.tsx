import React, { useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { KlineRecord } from '../types';
import { priceToY, idxToX } from '../services/chartLayout';
import { CANDLE_BODY_RATIO, CHART_H_PAD } from '../constants';
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
    // Issue 3: offset x by CHART_H_PAD so candles never flush against the left edge
    const x = idxToX(idx, totalCandles, candleWidthPx, offsetPx, areaWidth) + CHART_H_PAD;
    const wickTop = priceToY(c.high, priceMin, priceMax, priceAreaHeight, topPad);
    const wickBottom = priceToY(c.low, priceMin, priceMax, priceAreaHeight, topPad);
    const isBull = c.close >= c.open;

    // Issue 11: render a doji (open ≈ close within 0.05% of price) as horizontal line + wick
    const isDoji = c.open > 0 && Math.abs(c.open - c.close) / c.open < 0.0005;
    if (isDoji) {
      const dojiY = priceToY((c.open + c.close) / 2, priceMin, priceMax, priceAreaHeight, topPad);
      const wickPath = isBull ? bullWickPath : bearWickPath;
      const bodyPath = isBull ? bullPath : bearPath;
      wickPath.moveTo(x, wickTop);
      wickPath.lineTo(x, wickBottom);
      // 1px-tall rect spanning the full body width acts as the doji horizontal line
      bodyPath.addRect(Skia.XYWHRect(x - halfBody, dojiY - 0.5, bodyWidth, 1));
      return;
    }

    const bodyTop = priceToY(Math.max(c.open, c.close), priceMin, priceMax, priceAreaHeight, topPad);
    const bodyBottom = priceToY(Math.min(c.open, c.close), priceMin, priceMax, priceAreaHeight, topPad);
    const bodyH = Math.max(1, Math.abs(bodyBottom - bodyTop));

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

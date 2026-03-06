import React, { useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';
import type { KlineRecord } from '../types';
import { idxToX } from '../services/chartLayout';
import { CANDLE_BODY_RATIO } from '../constants';

const BULL_COLOR = '#22c55e';
const BEAR_COLOR = '#ef4444';

function volToHeight(vol: number, maxVol: number, areaHeight: number): number {
  if (maxVol <= 0) return 0;
  return Math.max(1, (vol / maxVol) * areaHeight);
}

export interface VolumeLayerProps {
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  visibleStartIdx: number;
  visibleEndIdx: number;
  volumeAreaHeight: number;
  priceAreaHeight: number;
  candleWidthPx: number;
  offsetPx: number;
  totalCandles: number;
  areaWidth: number;
}

export function VolumeLayer(props: VolumeLayerProps) {
  const paths = useMemo(() => {
    const {
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
    } = props;

    const bullPath = Skia.Path.Make();
    const bearPath = Skia.Path.Make();
    const bodyWidth = candleWidthPx * CANDLE_BODY_RATIO;
    const halfBody = bodyWidth / 2;

    let maxVol = 0;
    const lastIdx = candles.length - 1;
    for (let i = visibleStartIdx; i <= visibleEndIdx; i++) {
      const c = i === lastIdx && liveCandle ? liveCandle : candles[i];
      if (c && c.volume > maxVol) maxVol = c.volume;
    }

    const baseY = priceAreaHeight + volumeAreaHeight;
    for (let i = visibleStartIdx; i <= visibleEndIdx; i++) {
      const c = i === lastIdx && liveCandle ? liveCandle : candles[i];
      if (!c) continue;
      const x = idxToX(i, totalCandles, candleWidthPx, offsetPx, areaWidth);
      const h = volToHeight(c.volume, maxVol, volumeAreaHeight);
      const top = baseY - h;
      const isBull = c.close >= c.open;
      const rect = Skia.XYWHRect(x - halfBody, top, bodyWidth, h);
      if (isBull) bullPath.addRect(rect);
      else bearPath.addRect(rect);
    }

    return { bullPath, bearPath };
  }, [
    props.candles,
    props.liveCandle,
    props.visibleStartIdx,
    props.visibleEndIdx,
    props.volumeAreaHeight,
    props.priceAreaHeight,
    props.candleWidthPx,
    props.offsetPx,
    props.totalCandles,
    props.areaWidth,
  ]);

  return (
    <>
      <Path path={paths.bullPath} color={BULL_COLOR} />
      <Path path={paths.bearPath} color={BEAR_COLOR} />
    </>
  );
}

import React, { useMemo } from 'react';
import { Group, Path, Skia } from '@shopify/react-native-skia';
import type { KlineRecord } from '../types';
import { idxToX } from '../services/chartLayout';
import { CANDLE_BODY_RATIO } from '../constants';
import { colors } from '../../theme/colors';

const BULL_COLOR = colors.chart.linePositive;
const BEAR_COLOR = colors.chart.lineNegative;
const SEPARATOR_COLOR = colors.chart.separator;

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

    // P0-13: separator between candle area and volume bars
    const sepPath = Skia.Path.Make();
    sepPath.moveTo(0, priceAreaHeight);
    sepPath.lineTo(areaWidth, priceAreaHeight);

    return { bullPath, bearPath, sepPath };
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
    <Group>
      <Path path={paths.sepPath} style="stroke" strokeWidth={0.5} color={SEPARATOR_COLOR} />
      <Path path={paths.bullPath} color={BULL_COLOR} />
      <Path path={paths.bearPath} color={BEAR_COLOR} />
    </Group>
  );
}

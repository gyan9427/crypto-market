import React, { useEffect, useState } from 'react';
import {
  Group,
  Path,
  RoundedRect,
  Skia,
  Text,
  matchFont,
} from '@shopify/react-native-skia';
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import type { KlineRecord } from '../types';
import { formatPrice, formatVolume, formatTime } from '../services/chartFormat';
import type { KlineInterval } from '../types';

const CROSSHAIR_COLOR = 'rgba(100,116,139,0.6)';
const TOOLTIP_BG = 'rgba(15,23,42,0.95)';
const FONT_SIZE = 10;

function getFont() {
  try {
    return matchFont({ fontSize: FONT_SIZE });
  } catch {
    return null;
  }
}

export interface CrosshairLayerProps {
  crosshairX: { value: number };
  crosshairY: { value: number };
  crosshairIdx: { value: number };
  candles: KlineRecord[];
  liveCandle: KlineRecord | null;
  interval: KlineInterval;
  priceAreaHeight: number;
  volumeAreaHeight: number;
  areaWidth: number;
  areaHeight: number;
}

export function CrosshairLayer(props: CrosshairLayerProps) {
  const {
    crosshairX,
    crosshairY,
    crosshairIdx,
    candles,
    liveCandle,
    interval,
    priceAreaHeight,
    areaWidth,
    areaHeight,
  } = props;
  const [font, setFont] = useState<ReturnType<typeof matchFont> | null>(null);

  useEffect(() => {
    setFont(getFont());
  }, []);

  const [state, setState] = useState({ x: -1, y: -1, idx: -1 });
  useAnimatedReaction(
    () => ({ x: crosshairX.value, y: crosshairY.value, idx: crosshairIdx.value }),
    (v) => runOnJS(setState)(v)
  );

  const { x, y, idx } = state;
  const visible = x >= 0;
  const candle =
    idx >= 0 && idx < candles.length
      ? idx === candles.length - 1 && liveCandle
        ? liveCandle
        : candles[idx]
      : null;

  const linePath = React.useMemo(() => {
    if (!visible) return Skia.Path.Make();
    const p = Skia.Path.Make();
    p.moveTo(x, 0);
    p.lineTo(x, priceAreaHeight);
    p.moveTo(0, y);
    p.lineTo(areaWidth, y);
    return p;
  }, [visible, x, y, priceAreaHeight, areaWidth]);

  if (!visible) return null;

  const tooltipW = 140;
  const tooltipH = 100;
  const tooltipX = x > areaWidth - tooltipW - 20 ? x - tooltipW - 10 : x + 10;
  const tooltipY = Math.max(0, Math.min(y - tooltipH / 2, areaHeight - tooltipH));

  return (
    <Group>
      <Path path={linePath} style="stroke" strokeWidth={1} color={CROSSHAIR_COLOR} />
      {candle && font && (
        <Group>
          <RoundedRect
            x={tooltipX}
            y={tooltipY}
            width={tooltipW}
            height={tooltipH}
            r={4}
            color={TOOLTIP_BG}
          />
          <Text
            x={tooltipX + 6}
            y={tooltipY + 12}
            text={formatTime(candle.openTime, interval)}
            font={font}
            color="#94a3b8"
          />
          <Text
            x={tooltipX + 6}
            y={tooltipY + 26}
            text={`O ${formatPrice(candle.open)}  H ${formatPrice(candle.high)}`}
            font={font}
            color="#e2e8f0"
          />
          <Text
            x={tooltipX + 6}
            y={tooltipY + 40}
            text={`L ${formatPrice(candle.low)}  C ${formatPrice(candle.close)}`}
            font={font}
            color="#e2e8f0"
          />
          <Text
            x={tooltipX + 6}
            y={tooltipY + 54}
            text={`V ${formatVolume(candle.volume)}`}
            font={font}
            color="#94a3b8"
          />
          {candle.tradeCount != null && (
            <Text
              x={tooltipX + 6}
              y={tooltipY + 68}
              text={`Trades ${candle.tradeCount}`}
              font={font}
              color="#94a3b8"
            />
          )}
        </Group>
      )}
    </Group>
  );
}

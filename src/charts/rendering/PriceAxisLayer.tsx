import React, { useMemo } from 'react';
import { Group, Path, Skia, Text, matchFont } from '@shopify/react-native-skia';
import { priceToY } from '../services/chartLayout';
import { formatPrice } from '../services/chartFormat';

const AXIS_COLOR = '#64748b';
const FONT_SIZE = 10;

// Module-level font — avoids first-render flash, fixes Android monospace fallback (P0-17)
const AXIS_FONT = (() => {
  try {
    return matchFont({ familyName: 'System', fontSize: FONT_SIZE, fontStyle: 'normal', fontWeight: 'normal' });
  } catch {
    return null;
  }
})();

export interface PriceAxisLayerProps {
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  topPad: number;
  areaWidth: number;
}

export function PriceAxisLayer(props: PriceAxisLayerProps) {
  const { priceMin, priceMax, priceAreaHeight, topPad, areaWidth } = props;

  // D13c: dynamic tick count — scales with available height, min 3, max 6
  const tickCount = Math.max(3, Math.min(6, Math.floor(priceAreaHeight / 48)));

  const ticks = useMemo(() => {
    const range = priceMax - priceMin || 1;
    const paddedMin = priceMin - range * 0.05;
    const paddedMax = priceMax + range * 0.05;
    const result: { price: number; y: number }[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const price = paddedMin + ((paddedMax - paddedMin) * i) / tickCount;
      const y = priceToY(price, priceMin, priceMax, priceAreaHeight, topPad);
      result.push({ price, y });
    }
    return result;
  }, [priceMin, priceMax, priceAreaHeight, topPad, tickCount]);

  const linePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(areaWidth, 0);
    p.lineTo(areaWidth, priceAreaHeight);
    return p;
  }, [areaWidth, priceAreaHeight]);

  return (
    <Group>
      <Path path={linePath} style="stroke" strokeWidth={0.5} color={AXIS_COLOR} />
      {AXIS_FONT && ticks.map(({ price, y }, i) => (
        <Text
          key={i}
          x={areaWidth + 4}
          y={y + FONT_SIZE / 2}
          text={formatPrice(price)}
          font={AXIS_FONT}
          color={AXIS_COLOR}
        />
      ))}
    </Group>
  );
}

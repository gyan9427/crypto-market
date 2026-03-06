import React, { useMemo, useState, useEffect } from 'react';
import { Group, Path, Skia, Text, matchFont } from '@shopify/react-native-skia';
import { priceToY } from '../services/chartLayout';
import { formatPrice } from '../services/chartFormat';

const AXIS_COLOR = '#64748b';
const FONT_SIZE = 10;

export interface PriceAxisLayerProps {
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  topPad: number;
  areaWidth: number;
}

function getFont() {
  try {
    return matchFont({ fontSize: FONT_SIZE });
  } catch {
    return null;
  }
}

export function PriceAxisLayer(props: PriceAxisLayerProps) {
  const { priceMin, priceMax, priceAreaHeight, topPad, areaWidth } = props;
  const [font, setFont] = useState<ReturnType<typeof matchFont> | null>(null);

  useEffect(() => {
    setFont(getFont());
  }, []);

  const ticks = useMemo(() => {
    const range = priceMax - priceMin || 1;
    const paddedMin = priceMin - range * 0.05;
    const paddedMax = priceMax + range * 0.05;
    const result: { price: number; y: number }[] = [];
    for (let i = 0; i <= 5; i++) {
      const price = paddedMin + ((paddedMax - paddedMin) * i) / 5;
      const y = priceToY(price, priceMin, priceMax, priceAreaHeight, topPad);
      result.push({ price, y });
    }
    return result;
  }, [priceMin, priceMax, priceAreaHeight, topPad]);

  const linePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(areaWidth, 0);
    p.lineTo(areaWidth, priceAreaHeight);
    return p;
  }, [areaWidth, priceAreaHeight]);

  return (
    <Group>
      <Path path={linePath} style="stroke" strokeWidth={0.5} color={AXIS_COLOR} />
      {font && ticks.map(({ price, y }, i) => (
        <Text
          key={i}
          x={areaWidth + 4}
          y={y + FONT_SIZE / 2}
          text={formatPrice(price)}
          font={font}
          color={AXIS_COLOR}
        />
      ))}
    </Group>
  );
}

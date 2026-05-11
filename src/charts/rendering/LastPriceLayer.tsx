import React from 'react';
import { Circle, DashPathEffect, Group, Path, RoundedRect, Skia, Text, matchFont } from '@shopify/react-native-skia';
import { priceToY } from '../services/chartLayout';
import { formatPrice } from '../services/chartFormat';
import { colors } from '../../theme/colors';

const FONT_SIZE = 10;
const LABEL_FONT = (() => {
  try {
    return matchFont({ familyName: 'System', fontSize: FONT_SIZE, fontStyle: 'normal', fontWeight: 'normal' });
  } catch {
    return null;
  }
})();

export interface LastPriceLayerProps {
  lastClose: number;
  firstOpen: number;
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  topPad: number;
  areaWidth: number;
}

export function LastPriceLayer(props: LastPriceLayerProps) {
  const { lastClose, firstOpen, priceMin, priceMax, priceAreaHeight, topPad, areaWidth } = props;

  const isPositive = lastClose >= firstOpen;
  const lineColor = isPositive ? colors.accent.positive : colors.accent.negative;
  const pillBg = isPositive ? colors.accent.positiveSubtle : colors.accent.negativeSubtle;

  const y = priceToY(lastClose, priceMin, priceMax, priceAreaHeight, topPad);

  const linePath = React.useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, y);
    p.lineTo(areaWidth, y);
    return p;
  }, [y, areaWidth]);

  const label = formatPrice(lastClose);
  const labelW = label.length * 6 + 8;
  const labelX = areaWidth + 2;
  const labelY = y - FONT_SIZE / 2;

  return (
    <Group>
      <Path path={linePath} style="stroke" strokeWidth={0.5} color={lineColor}>
        <DashPathEffect intervals={[4, 6]} />
      </Path>
      <Circle cx={areaWidth} cy={y} r={3} color={lineColor} />
      {LABEL_FONT && (
        <Group>
          <RoundedRect
            x={labelX}
            y={labelY - 2}
            width={labelW}
            height={FONT_SIZE + 4}
            r={3}
            color={pillBg}
          />
          <Text
            x={labelX + 4}
            y={labelY + FONT_SIZE - 1}
            text={label}
            font={LABEL_FONT}
            color={lineColor}
          />
        </Group>
      )}
    </Group>
  );
}

import React from 'react';
import { Group, Path, Skia, DashPathEffect } from '@shopify/react-native-skia';
import { priceToY } from '../services/chartLayout';
import { useChartUi } from '../ChartUiContext';

export interface ReferencePriceLayerProps {
  sessionOpenPrice: number;
  priceMin: number;
  priceMax: number;
  priceAreaHeight: number;
  topPad: number;
  areaWidth: number;
}

export function ReferencePriceLayer(props: ReferencePriceLayerProps) {
  const { reference } = useChartUi();
  const { sessionOpenPrice, priceMin, priceMax, priceAreaHeight, topPad, areaWidth } = props;

  const linePath = React.useMemo(() => {
    const y = priceToY(sessionOpenPrice, priceMin, priceMax, priceAreaHeight, topPad);
    const p = Skia.Path.Make();
    p.moveTo(0, y);
    p.lineTo(areaWidth, y);
    return p;
  }, [sessionOpenPrice, priceMin, priceMax, priceAreaHeight, topPad, areaWidth]);

  return (
    <Group>
      <Path path={linePath} style="stroke" strokeWidth={0.5} color={reference}>
        <DashPathEffect intervals={[4, 6]} />
      </Path>
    </Group>
  );
}

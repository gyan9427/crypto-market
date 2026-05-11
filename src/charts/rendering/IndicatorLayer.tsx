import React, { useMemo } from 'react';
import { Path, Skia } from '@shopify/react-native-skia';

export interface IndicatorLine {
  points: { x: number; y: number }[];
  color: string;
}

export interface IndicatorLayerProps {
  lines: IndicatorLine[];
}

/** Overlay layer for technical indicator lines (EMA, BB, etc.). Renders above candles, below crosshair. */
export function IndicatorLayer({ lines }: IndicatorLayerProps) {
  const paths = useMemo(
    () =>
      lines.map((l) => {
        const p = Skia.Path.Make();
        l.points.forEach((pt, i) => (i === 0 ? p.moveTo(pt.x, pt.y) : p.lineTo(pt.x, pt.y)));
        return { path: p, color: l.color };
      }),
    [lines]
  );

  return (
    <>
      {paths.map((p, i) => (
        <Path key={i} path={p.path} style="stroke" strokeWidth={1.5} color={p.color} />
      ))}
    </>
  );
}

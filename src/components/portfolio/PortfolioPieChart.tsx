import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import type { CompositionSlice } from '@/src/utils/portfolioComposition';

type PortfolioPieChartProps = {
  slices: CompositionSlice[];
  size?: number;
  innerRadiusRatio?: number;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function ringSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  if (endAngle - startAngle >= 359.99) {
    return [
      `M ${cx - outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
      `M ${cx - innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
      'Z',
    ].join(' ');
  }

  const outerStart = polar(cx, cy, outerR, endAngle);
  const outerEnd = polar(cx, cy, outerR, startAngle);
  const innerStart = polar(cx, cy, innerR, endAngle);
  const innerEnd = polar(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({
  slices,
  size = 120,
  innerRadiusRatio = 0.55,
}) => {
  const paths = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 2;
    const innerR = outerR * innerRadiusRatio;
    let cursor = 0;

    return slices.map((slice) => {
      const sweep = (slice.pct / 100) * 360;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end;
      return {
        key: slice.key,
        color: slice.color,
        d: ringSlicePath(cx, cy, outerR, innerR, start, end),
      };
    });
  }, [slices, size, innerRadiusRatio]);

  if (slices.length === 0) {
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.06)" />
        </Svg>
      </View>
    );
  }

  if (slices.length === 1) {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 2;
    const innerR = outerR * innerRadiusRatio;
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={outerR} fill={slices[0].color} />
          <Circle cx={cx} cy={cy} r={innerR} fill="#0f0f14" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {paths.map((p) => (
            <Path key={p.key} d={p.d} fill={p.color} />
          ))}
        </G>
      </Svg>
    </View>
  );
};

import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { colors } from '@/src/theme/theme';

export interface IllustrationPersonalizationProps {
  width: number;
  height: number;
}

function IllustrationPersonalizationInner({ width, height }: IllustrationPersonalizationProps) {
  const w = width;
  const h = height;
  const primary = colors.primary[500];
  const accent = colors.accent[500];
  const neutral = colors.neutral;

  const tile = (x: number, y: number, tw: number, th: number, fill: string, o: number) => (
    <Rect x={x} y={y} width={tw} height={th} rx={10} fill={fill} opacity={o} stroke={primary} strokeWidth={1.2} />
  );

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {tile(w * 0.1, h * 0.18, w * 0.35, h * 0.2, neutral[100], 0.95)}
        {tile(w * 0.52, h * 0.12, w * 0.38, h * 0.26, neutral[50], 1)}
        {tile(w * 0.08, h * 0.48, w * 0.42, h * 0.22, neutral[100], 0.9)}
        {tile(w * 0.55, h * 0.45, w * 0.36, h * 0.28, accent, 0.12)}
        <Rect
          x={w * 0.58}
          y={h * 0.52}
          width={w * 0.3}
          height={h * 0.06}
          rx={4}
          fill={primary}
          opacity={0.25}
        />
        {tile(w * 0.22, h * 0.72, w * 0.56, h * 0.18, neutral[200], 0.35)}
        <Circle cx={w * 0.18} cy={h * 0.28} r={6} fill={primary} opacity={0.5} />
        <Circle cx={w * 0.88} cy={h * 0.62} r={5} fill={accent} opacity={0.55} />
        <Rect x={w * 0.62} y={h * 0.22} width={w * 0.22} height={6} rx={3} fill={primary} opacity={0.4} />
        <Rect x={w * 0.62} y={h * 0.32} width={w * 0.3} height={4} rx={2} fill={neutral[500]} opacity={0.35} />
      </Svg>
    </View>
  );
}

export const IllustrationPersonalization = memo(IllustrationPersonalizationInner);

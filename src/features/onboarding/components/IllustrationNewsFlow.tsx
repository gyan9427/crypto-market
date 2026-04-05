import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { colors } from '@/src/theme/theme';

export interface IllustrationNewsFlowProps {
  width: number;
  height: number;
}

/** Abstract flowing news cards — theme tokens only */
function IllustrationNewsFlowInner({ width, height }: IllustrationNewsFlowProps) {
  const w = width;
  const h = height;
  const cardW = w * 0.72;
  const cardH = h * 0.22;
  const left = w * 0.14;
  const primary = colors.primary[500];
  const accent = colors.accent[400];
  const neutral = colors.neutral;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Rect
          x={left}
          y={h * 0.12}
          width={cardW}
          height={cardH}
          rx={10}
          fill={neutral[100]}
          stroke={primary}
          strokeWidth={1.5}
          opacity={0.95}
        />
        <Rect x={left + 10} y={h * 0.17} width={cardW * 0.35} height={6} rx={3} fill={primary} opacity={0.35} />
        <Rect x={left + 10} y={h * 0.26} width={cardW * 0.7} height={4} rx={2} fill={neutral[400]} opacity={0.5} />
        <Rect x={left + 10} y={h * 0.33} width={cardW * 0.55} height={4} rx={2} fill={neutral[400]} opacity={0.35} />

        <Rect
          x={left + w * 0.08}
          y={h * 0.38}
          width={cardW}
          height={cardH}
          rx={10}
          fill={neutral[50]}
          stroke={accent}
          strokeWidth={1.5}
          opacity={0.98}
        />
        <Rect x={left + w * 0.08 + 10} y={h * 0.44} width={cardW * 0.4} height={6} rx={3} fill={accent} opacity={0.4} />
        <Rect x={left + w * 0.08 + 10} y={h * 0.52} width={cardW * 0.65} height={4} rx={2} fill={neutral[500]} opacity={0.4} />
        <Rect x={left + w * 0.08 + 10} y={h * 0.59} width={cardW * 0.5} height={4} rx={2} fill={neutral[500]} opacity={0.3} />

        <Rect
          x={left}
          y={h * 0.64}
          width={cardW}
          height={cardH}
          rx={10}
          fill={neutral[100]}
          stroke={primary}
          strokeWidth={1.5}
          opacity={0.85}
        />
        <Rect x={left + 10} y={h * 0.7} width={cardW * 0.32} height={6} rx={3} fill={primary} opacity={0.3} />
        <Rect x={left + 10} y={h * 0.78} width={cardW * 0.75} height={4} rx={2} fill={neutral[400]} opacity={0.45} />

        <Circle cx={w * 0.88} cy={h * 0.22} r={5} fill={accent} opacity={0.85} />
        <Circle cx={w * 0.1} cy={h * 0.55} r={4} fill={primary} opacity={0.6} />
      </Svg>
    </View>
  );
}

export const IllustrationNewsFlow = memo(IllustrationNewsFlowInner);

import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { colors } from '@/src/theme/theme';

export interface IllustrationMarketProps {
  width: number;
  height: number;
}

function IllustrationMarketInner({ width, height }: IllustrationMarketProps) {
  const w = width;
  const h = height;
  const pad = w * 0.08;
  const chartH = h * 0.55;
  const chartTop = h * 0.28;
  const chartW = w - pad * 2;
  const stroke = colors.success[600];
  const muted = colors.neutral[400];
  const primary = colors.primary[500];

  const p1 = `M ${pad + chartW * 0.05} ${chartTop + chartH * 0.65}`;
  const pathD = `${p1} L ${pad + chartW * 0.2} ${chartTop + chartH * 0.45} L ${pad + chartW * 0.38} ${chartTop + chartH * 0.52} L ${pad + chartW * 0.55} ${chartTop + chartH * 0.28} L ${pad + chartW * 0.72} ${chartTop + chartH * 0.35} L ${pad + chartW * 0.92} ${chartTop + chartH * 0.12}`;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Rect x={pad} y={h * 0.08} width={w - pad * 2} height={h * 0.14} rx={8} fill={colors.neutral[100]} />
        <Rect x={pad + 10} y={h * 0.11} width={w * 0.22} height={8} rx={4} fill={primary} opacity={0.35} />
        <Rect x={pad + 10} y={h * 0.165} width={w * 0.35} height={5} rx={2} fill={muted} opacity={0.5} />

        <Line
          x1={pad}
          y1={chartTop + chartH * 0.33}
          x2={w - pad}
          y2={chartTop + chartH * 0.33}
          stroke={muted}
          strokeWidth={1}
          strokeDasharray="4 6"
          opacity={0.35}
        />
        <Line
          x1={pad}
          y1={chartTop + chartH * 0.66}
          x2={w - pad}
          y2={chartTop + chartH * 0.66}
          stroke={muted}
          strokeWidth={1}
          strokeDasharray="4 6"
          opacity={0.25}
        />

        <Path d={pathD} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={pad + chartW * 0.92} cy={chartTop + chartH * 0.12} r={5} fill={stroke} />
        <Circle cx={pad + chartW * 0.55} cy={chartTop + chartH * 0.28} r={3} fill={primary} opacity={0.7} />

        <Rect x={w * 0.62} y={h * 0.08} width={w * 0.22} height={h * 0.065} rx={6} fill={colors.neutral[200]} />
        <Rect x={w * 0.65} y={h * 0.095} width={w * 0.12} height={5} rx={2} fill={stroke} opacity={0.85} />
      </Svg>
    </View>
  );
}

export const IllustrationMarket = memo(IllustrationMarketInner);

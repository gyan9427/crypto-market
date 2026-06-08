import React from 'react';
import { View, type ColorValue } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type TabBarMenuIconProps = {
  color: ColorValue;
  size: number;
};

/**
 * Tab-bar hamburger tuned to match Lucide outline icons (Home, Briefcase, etc.):
 * even line lengths, round caps, and balanced vertical rhythm at any size.
 */
export function TabBarMenuIcon({ color, size }: TabBarMenuIconProps) {
  const stroke = Math.max(1.5, size * 0.083);
  const inset = size * 0.2;
  const lineLength = size - inset * 2;
  const x1 = inset;
  const x2 = inset + lineLength;
  // Slightly below geometric center to optically match Lucide tab icons.
  const rows = [size * 0.34, size * 0.5, size * 0.66];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rows.map((y) => (
          <Line
            key={y}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ))}
      </Svg>
    </View>
  );
}

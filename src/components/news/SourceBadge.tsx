import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SourceLogo } from './SourceLogo';
import type { NewsSourceInfo } from '../../types';

interface SourceBadgeProps {
  sourceInfo?: NewsSourceInfo;
  sourceName?: string;
  /** Optional callback when the badge is tapped (e.g. to open source URL) */
  onPress?: () => void;
  size?: number;
  textStyle?: object;
  containerStyle?: object;
}

/**
 * Displays [SourceLogo] [SourceName] inline.
 * Gracefully degrades to plain source name text when sourceInfo is absent.
 */
export const SourceBadge = React.memo<SourceBadgeProps>(({
  sourceInfo,
  sourceName,
  onPress,
  size = 14,
  textStyle,
  containerStyle,
}) => {
  const name = sourceInfo?.name ?? sourceName ?? '';
  const logoUrl = sourceInfo?.logoUrl ?? null;

  const content = (
    <View style={[styles.container, containerStyle]}>
      <SourceLogo logoUrl={logoUrl} sourceName={name} size={size} />
      {name.length > 0 && (
        <Text style={[styles.name, { fontSize: size - 2 }, textStyle]} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={`View source: ${name}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

SourceBadge.displayName = 'SourceBadge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: '#888',
    fontWeight: '500',
    flexShrink: 1,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface SourceLogoProps {
  logoUrl: string | null | undefined;
  sourceName: string;
  size?: number;
}

/**
 * Displays the source logo image. Falls back to a single-letter placeholder
 * if the URL is missing or fails to load. Never crashes the feed.
 */
export const SourceLogo = React.memo<SourceLogoProps>(({ logoUrl, sourceName, size = 16 }) => {
  const { tokens } = useAppTheme();
  const [failed, setFailed] = useState(false);

  const letter = (sourceName?.charAt(0) ?? '?').toUpperCase();
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };

  if (!logoUrl || failed) {
    return (
      <View style={[styles.placeholder, containerStyle, { backgroundColor: tokens.colors.neutral[200] }]}>
        <Text style={[styles.letter, { fontSize: size * 0.55, color: tokens.colors.neutral[600] }]}>{letter}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={[styles.logo, containerStyle]}
      contentFit="contain"
      onError={() => setFailed(true)}
      accessibilityLabel={sourceName}
      transition={150}
    />
  );
});

SourceLogo.displayName = 'SourceLogo';

const styles = StyleSheet.create({
  logo: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '600',
    lineHeight: undefined,
  },
});

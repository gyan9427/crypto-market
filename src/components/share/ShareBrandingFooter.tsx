import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { resolveShareFooterLink } from '@/src/config/shareUrls';
import { SHARE_CARD_WIDTH, SHARE_FOOTER_HEIGHT_RATIO, shareCardColors } from '@/src/share/shareCardTheme';

type Props = {
  cardWidth?: number;
  cardHeight?: number;
  style?: ViewStyle;
  interactive?: boolean;
};

export function ShareBrandingFooter({
  cardWidth = SHARE_CARD_WIDTH,
  cardHeight,
  style,
  interactive = true,
}: Props) {
  const footerHeight = cardHeight ?? Math.round(cardWidth * SHARE_FOOTER_HEIGHT_RATIO);
  const scale = cardWidth / SHARE_CARD_WIDTH;
  const paddingH = Math.round(60 * scale);

  const s = useMemo(
    () =>
      StyleSheet.create({
        footer: {
          height: footerHeight,
          backgroundColor: shareCardColors.bg,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: shareCardColors.divider,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: paddingH,
        },
        wordmark: {
          color: shareCardColors.textMuted,
          fontSize: Math.round(11 * scale),
          fontWeight: '600',
          letterSpacing: 2.0,
        },
        domain: {
          color: shareCardColors.domain,
          fontSize: Math.round(11 * scale),
          fontWeight: '400',
          letterSpacing: 0.5,
        },
      }),
    [footerHeight, paddingH, scale],
  );

  const content = (
    <View style={[s.footer, style]}>
      <Text style={s.wordmark}>NAYFT INTELLIGENCE</Text>
      <Text style={s.domain}>nayft.com</Text>
    </View>
  );

  if (!interactive) return content;

  return (
    <Pressable
      onPress={() => void Linking.openURL(resolveShareFooterLink())}
      accessibilityRole="link"
      accessibilityLabel="Open NAYFT"
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      {content}
    </Pressable>
  );
}

export function useShareFooterHeight(cardWidth: number, cardHeight?: number): number {
  return useMemo(
    () => cardHeight ?? Math.round(cardWidth * SHARE_FOOTER_HEIGHT_RATIO),
    [cardWidth, cardHeight],
  );
}

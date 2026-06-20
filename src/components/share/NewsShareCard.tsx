import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShareBrandingFooter, useShareFooterHeight } from '@/src/components/share/ShareBrandingFooter';
import type { ShareableNews } from '@/src/utils/share';
import {
  SHARE_CARD_MIN_HEIGHT,
  SHARE_CARD_WIDTH,
  SHARE_FOOTER_HEIGHT_RATIO,
  shareCardColors,
} from '@/src/share/shareCardTheme';

type Props = {
  item: ShareableNews;
  width?: number;
  height?: number;
  forExport?: boolean;
};

function getSnippet(item: ShareableNews): string {
  const raw = item.snippet?.trim() || item.subtitle?.trim() || '';
  if (!raw) return '';
  return raw.length > 220 ? `${raw.slice(0, 217).trim()}…` : raw;
}

function getCategory(item: ShareableNews): string {
  return (item.categories?.[0]?.name ?? 'CRYPTO').toUpperCase();
}

function formatAge(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NewsShareCard({ item, width = SHARE_CARD_WIDTH, height, forExport = false }: Props) {
  const scale = width / SHARE_CARD_WIDTH;
  const footerHeight = useShareFooterHeight(width, height ? Math.round(height * SHARE_FOOTER_HEIGHT_RATIO) : undefined);
  const cardHeight = height ?? SHARE_CARD_MIN_HEIGHT;
  const contentHeight = cardHeight - footerHeight;

  const sourceName = item.sourceInfo?.name ?? item.source ?? '';
  const snippet = getSnippet(item);
  const category = getCategory(item);
  const timestamp = formatAge(item.publishedAt);

  const s = useMemo(() => {
    const pad = Math.round(60 * scale);
    const headlineFontSize = Math.round(54 * scale);
    const summaryFontSize = Math.round(24 * scale);
    const metaFontSize = Math.round(11 * scale);
    const sourceFontSize = Math.round(14 * scale);
    const dotSize = Math.round(7 * scale);
    const accentBorderWidth = Math.round(3 * scale);
    const headlineAccentPad = Math.round(20 * scale);

    return StyleSheet.create({
      card: {
        width,
        height: cardHeight,
        backgroundColor: shareCardColors.bg,
        overflow: 'hidden',
      },
      content: {
        height: contentHeight,
        paddingHorizontal: pad,
        paddingTop: pad,
        paddingBottom: pad,
        flexDirection: 'column',
      },
      metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      categoryTag: {
        backgroundColor: shareCardColors.accentSubtle,
        borderRadius: Math.round(4 * scale),
        paddingHorizontal: Math.round(12 * scale),
        paddingVertical: Math.round(6 * scale),
      },
      categoryText: {
        color: shareCardColors.accent,
        fontSize: metaFontSize,
        fontWeight: '700',
        letterSpacing: 1.4,
      },
      timestamp: {
        color: shareCardColors.textMuted,
        fontSize: metaFontSize,
        fontWeight: '400',
      },
      sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Math.round(18 * scale),
      },
      sourceDot: {
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: shareCardColors.accent,
        marginRight: Math.round(9 * scale),
      },
      sourceName: {
        color: shareCardColors.textSecondary,
        fontSize: sourceFontSize,
        fontWeight: '500',
      },
      accentDivider: {
        height: StyleSheet.hairlineWidth * 2,
        backgroundColor: shareCardColors.accentDivider,
        marginTop: Math.round(26 * scale),
      },
      headlineAccent: {
        borderLeftWidth: accentBorderWidth,
        borderLeftColor: shareCardColors.accent,
        paddingLeft: headlineAccentPad,
        marginTop: Math.round(52 * scale),
      },
      headline: {
        color: shareCardColors.textPrimary,
        fontSize: headlineFontSize,
        fontWeight: '800',
        lineHeight: Math.round(headlineFontSize * 1.15),
      },
      summary: {
        color: shareCardColors.textSecondary,
        fontSize: summaryFontSize,
        fontWeight: '400',
        lineHeight: Math.round(summaryFontSize * 1.5),
        marginTop: Math.round(20 * scale),
        paddingLeft: headlineAccentPad + accentBorderWidth,
      },
      spacer: {
        flex: 1,
      },
    });
  }, [scale, width, cardHeight, contentHeight]);

  return (
    <View style={s.card}>
      <View style={s.content}>
        <View style={s.metadataRow}>
          <View style={s.categoryTag}>
            <Text style={s.categoryText}>{category}</Text>
          </View>
          <Text style={s.timestamp}>{timestamp}</Text>
        </View>

        {sourceName ? (
          <View style={s.sourceRow}>
            <View style={s.sourceDot} />
            <Text style={s.sourceName}>{sourceName}</Text>
          </View>
        ) : null}

        <View style={s.accentDivider} />

        <View style={s.headlineAccent}>
          <Text style={s.headline} numberOfLines={3}>
            {item.title}
          </Text>
        </View>

        {snippet ? (
          <Text style={s.summary} numberOfLines={3}>
            {snippet}
          </Text>
        ) : null}

        <View style={s.spacer} />
      </View>

      <ShareBrandingFooter
        cardWidth={width}
        cardHeight={footerHeight}
        interactive={!forExport}
      />
    </View>
  );
}

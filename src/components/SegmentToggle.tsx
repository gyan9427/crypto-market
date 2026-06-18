import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { AppText } from '@/src/design-system/primitives/AppText';

interface SegmentToggleProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Omit default horizontal margins (e.g. nested in a card) */
  flush?: boolean;
  /** Optional subtitle for each option (enables tab-bar style layout) */
  subtitles?: string[];
  /** Optional icon element for each option */
  icons?: React.ReactNode[];
}

export const SegmentToggle: React.FC<SegmentToggleProps> = ({
  options,
  selectedIndex,
  onSelect,
  flush = false,
  subtitles,
  icons,
}) => {
  const { tokens } = useAppTheme();
  const hasRichTabs = Boolean(subtitles?.length);
  const styles = useMemo(() => buildStyles(tokens, flush, hasRichTabs), [tokens, flush, hasRichTabs]);
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!containerWidth) return;

    const segmentWidthPx = containerWidth / options.length;

    Animated.timing(translateX, {
      toValue: selectedIndex * segmentWidthPx,
      duration: tokens.motion.duration.normal,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, containerWidth, options.length, translateX, tokens.motion.duration.normal]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  if (hasRichTabs) {
    return (
      <View style={styles.richContainer} onLayout={handleLayout}>
        {options.map((option, index) => {
          const isActive = selectedIndex === index;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.richSegment,
                isActive ? styles.richSegmentActive : styles.richSegmentInactive,
              ]}
              onPress={() => onSelect(index)}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.7}
            >
              {/* Icon + label pill row */}
              <View style={[styles.richPill, isActive && styles.richPillActive]}>
                {icons?.[index] && (
                  <View style={styles.richIcon}>{icons[index]}</View>
                )}
                <AppText
                  variant="body-s"
                  style={[
                    styles.richLabel,
                    isActive ? styles.richLabelActive : styles.richLabelInactive,
                  ]}
                >
                  {option}
                </AppText>
              </View>
              {subtitles?.[index] && (
                <AppText
                  variant="caption"
                  style={[
                    styles.richSubtitle,
                    isActive ? styles.richSubtitleActive : styles.richSubtitleInactive,
                  ]}
                >
                  {subtitles[index]}
                </AppText>
              )}
            </TouchableOpacity>
          );
        })}

      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: containerWidth / options.length,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={styles.segment}
          onPress={() => onSelect(index)}
          accessibilityRole="button"
          accessibilityLabel={option}
          accessibilityState={{ selected: selectedIndex === index }}
        >
          <AppText
            variant="body-s"
            color={selectedIndex === index ? 'link' : 'muted'}
            style={[
              styles.segmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

function buildStyles(tokens: ThemeTokens, flush: boolean, hasRichTabs: boolean) {
  const c = tokens.colors;
  const primaryColor = c.primary[tokens.isDark ? 400 : 600];

  return StyleSheet.create({
    // ── Standard pill toggle ─────────────────────────────────────────────────
    container: {
      flexDirection: 'row',
      backgroundColor: tokens.surfaceMuted,
      borderRadius: tokens.borderRadius.button,
      borderWidth: 1,
      borderColor: tokens.borderSubtle,
      padding: 3,
      position: 'relative',
      marginHorizontal: flush ? 0 : 16,
      marginBottom: flush ? 0 : 16,
    },
    indicator: {
      position: 'absolute',
      left: 3,
      top: 3,
      bottom: 3,
      backgroundColor: tokens.bgElevated,
      borderRadius: tokens.borderRadius.button - 2,
      borderWidth: 1,
      borderColor: tokens.border,
      shadowColor: tokens.isDark ? '#000' : 'rgba(88,28,135,0.15)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: tokens.isDark ? 0.35 : 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    segment: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      minHeight: 44,
    },
    segmentText: {
      fontSize: tokens.typography.fontSizes.base,
      fontWeight: tokens.typography.fontWeights.medium,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
      color: tokens.textMuted,
      letterSpacing: tokens.typography.letterSpacing.button,
    },
    segmentTextActive: {
      color: primaryColor,
      fontWeight: tokens.typography.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },

    // ── Rich tab-bar style toggle ────────────────────────────────────────────
    richContainer: {
      flexDirection: 'row',
      position: 'relative',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.borderSubtle,
      backgroundColor: tokens.bg,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 0,
      gap: 3,
    },
    richSegment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 6,
      gap: 1,
      borderRadius: 5,
    },
    richSegmentActive: {
      backgroundColor: tokens.surface,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
      shadowColor: tokens.isDark ? '#000' : 'rgba(0,0,0,0.07)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    richSegmentInactive: {
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    richPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    richPillActive: {},
    richIcon: {},
    richLabel: {
      fontSize: 13,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      fontWeight: tokens.typography.fontWeights.semibold,
    },
    richLabelActive: {
      color: primaryColor,
    },
    richLabelInactive: {
      color: tokens.textMuted,
    },
    richSubtitle: {
      fontSize: 10,
      fontFamily: tokens.typography.fontFamilies.sans,
      textAlign: 'center',
      lineHeight: 13,
    },
    richSubtitleActive: {
      color: tokens.textMuted,
    },
    richSubtitleInactive: {
      color: tokens.textMuted,
      opacity: 0.55,
    },
  });
}

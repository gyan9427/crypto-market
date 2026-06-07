import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, AccessibilityInfo } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import type { AuthPalette } from '@/src/components/auth/authPalette';
// @ts-expect-error Metro resolves SkiaProgressBar.{ios,android,web}; tsc has no extension map
import { SkiaProgressBar } from '@/src/components/SkiaProgressBar';
import type { PasswordEvaluationResult } from '@nayft/password-policy';

type Props = {
  palette: AuthPalette;
  result: PasswordEvaluationResult & { fillColor: string; levelLabelKey: string };
  visible: boolean;
  shakeToken?: number;
  isDark?: boolean;
};

export function PasswordStrengthMeter({
  palette,
  result,
  visible,
  shakeToken = 0,
  isDark = false,
}: Props) {
  const { t } = useTranslation();
  const prevLevel = useRef(result.level);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (prevLevel.current !== result.level) {
      AccessibilityInfo.announceForAccessibility(t(result.levelLabelKey));
      prevLevel.current = result.level;
    }
  }, [result.level, result.levelLabelKey, t]);

  useEffect(() => {
    if (shakeToken > 0) {
      translateX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [shakeToken, translateX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible) return null;

  const successColor = isDark ? '#4ade80' : '#22c55e';

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[styles.container, shakeStyle]}
      accessibilityRole="summary"
    >
      <View style={styles.barRow}>
        <SkiaProgressBar
          fillRatio={result.fillRatio}
          height={6}
          trackColor={palette.border}
          fillColor={result.fillColor}
          borderRadius={3}
        />
      </View>
      <Text
        style={[styles.levelLabel, { color: result.fillColor }]}
        accessibilityRole="text"
      >
        {t(result.levelLabelKey)}
      </Text>
      <View style={styles.checklist}>
        {result.checklist.map((item) => (
          <View key={item.key} style={styles.checkItem}>
            <Check
              size={14}
              color={item.passed ? successColor : palette.textSecondary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.checkText,
                {
                  color: item.passed ? palette.textPrimary : palette.textSecondary,
                  opacity: item.aspirational && !item.passed ? 0.8 : 1,
                },
              ]}
            >
              {t(item.labelKey)}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    marginTop: -8,
    marginBottom: 12,
  },
  barRow: {
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  checklist: {
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

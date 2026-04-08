import React, { useMemo, useRef, useState } from 'react';
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Text,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Bell, PlusCircle, FileText, Gift } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { useHasFeature } from '../utils/features';

interface FABProps {
  onPress?: () => void;
}

export const FAB: React.FC<FABProps> = ({ onPress }) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const hasRewards = useHasFeature('rewards');
  const hasFollow = useHasFeature('follow');
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const c = tokens.colors;

  const openSheet = () => {
    setVisible(true);
    onPress?.();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      callback?.();
    });
  };

  const handleAction = (action: string) => {
    closeSheet(() => {
      if (action === 'rewards') {
        router.push('/rewards');
      }
    });
  };

  return (
    <>
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel="Add action"
          activeOpacity={0.9}
        >
          <Plus size={28} color={c.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <Modal transparent visible={visible} animationType="none" onRequestClose={() => closeSheet()}>
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.bottomSheetBackground, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handleBar} />
          <View style={styles.bottomSheetContent}>
            <Text style={styles.sheetTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => handleAction('alert')}
              accessibilityRole="button"
              accessibilityLabel="Add Alert"
            >
              <View style={styles.sheetIconContainer}>
                <Bell size={24} color={c.primary[500]} />
              </View>
              <View style={styles.sheetActionText}>
                <Text style={styles.sheetActionTitle}>Add Alert</Text>
                <Text style={styles.sheetActionSubtitle}>Set price alerts for coins</Text>
              </View>
            </TouchableOpacity>

            {hasFollow && (
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleAction('watchlist')}
                accessibilityRole="button"
                accessibilityLabel="Add to Watchlist"
              >
                <View style={styles.sheetIconContainer}>
                  <PlusCircle size={24} color={c.accent[500]} />
                </View>
                <View style={styles.sheetActionText}>
                  <Text style={styles.sheetActionTitle}>Add to Watchlist</Text>
                  <Text style={styles.sheetActionSubtitle}>Track your favorite coins</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => handleAction('submit')}
              accessibilityRole="button"
              accessibilityLabel="Submit News"
            >
              <View style={styles.sheetIconContainer}>
                <FileText size={24} color={c.success[500]} />
              </View>
              <View style={styles.sheetActionText}>
                <Text style={styles.sheetActionTitle}>Submit News</Text>
                <Text style={styles.sheetActionSubtitle}>Share crypto news with community</Text>
              </View>
            </TouchableOpacity>

            {hasRewards && (
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleAction('rewards')}
                accessibilityRole="button"
                accessibilityLabel="Rewards"
              >
                <View style={styles.sheetIconContainer}>
                  <Gift size={24} color={c.primary[500]} />
                </View>
                <View style={styles.sheetActionText}>
                  <Text style={styles.sheetActionTitle}>Rewards</Text>
                  <Text style={styles.sheetActionSubtitle}>View and claim your rewards</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
};

function buildStyles(tokens: ThemeTokens) {
  const { spacing, typography, borderRadius, semantic, shadows } = tokens;
  return StyleSheet.create({
    fabContainer: {
      position: 'absolute',
      bottom: 42,
      alignSelf: 'center',
      zIndex: 1000,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.fab,
      backgroundColor: tokens.colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: semantic.backdrop,
    },
    bottomSheetBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.bgElevated,
      borderTopLeftRadius: semantic.sheetRadius,
      borderTopRightRadius: semantic.sheetRadius,
      ...shadows.lg,
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.colors.neutral[300],
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    bottomSheetContent: {
      padding: semantic.listMarginH,
      paddingTop: spacing.sm,
    },
    sheetTitle: {
      fontSize: typography.fontSizes.xl,
      fontWeight: typography.fontWeights.bold,
      color: tokens.text,
      marginBottom: spacing.lg,
      fontFamily: typography.fontFamilies.sansBold,
    },
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      minHeight: 60,
    },
    sheetIconContainer: {
      width: 48,
      height: 48,
      borderRadius: semantic.sheetRadius,
      backgroundColor: tokens.isDark ? tokens.colors.neutral[200] : tokens.colors.neutral[100],
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: semantic.cardPadding,
    },
    sheetActionText: {
      flex: 1,
    },
    sheetActionTitle: {
      fontSize: typography.fontSizes.md,
      fontWeight: typography.fontWeights.semibold,
      color: tokens.text,
      marginBottom: 2,
      fontFamily: typography.fontFamilies.sansSemiBold,
    },
    sheetActionSubtitle: {
      fontSize: typography.fontSizes.sm,
      color: tokens.textMuted,
      fontFamily: typography.fontFamilies.sans,
    },
  });
}

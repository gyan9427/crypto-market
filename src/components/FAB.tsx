import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  View,
  Text,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, PlusCircle, FileText, Gift } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import { useHasFeature } from '../utils/features';

interface QuickActionsContextValue {
  open: () => void;
}

const QuickActionsContext = createContext<QuickActionsContextValue | null>(null);

export function useQuickActions(): QuickActionsContextValue {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) {
    throw new Error('useQuickActions must be used within QuickActionsProvider');
  }
  return ctx;
}

interface QuickActionsProviderProps {
  children: React.ReactNode;
  onPress?: () => void;
}

interface QuickActionRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel: string;
  styles: ReturnType<typeof buildStyles>;
}

const QuickActionRow: React.FC<QuickActionRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  styles,
}) => (
  <TouchableOpacity
    style={styles.sheetAction}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <View style={styles.sheetIconContainer}>{icon}</View>
    <View style={styles.sheetActionText}>
      <Text style={styles.sheetActionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.sheetActionSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

export const QuickActionsProvider: React.FC<QuickActionsProviderProps> = ({
  children,
  onPress,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const hasRewards = useHasFeature('rewards');
  const hasFollow = useHasFeature('follow');
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const c = tokens.colors;

  const openSheet = useCallback(() => {
    setVisible(true);
    onPress?.();
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [onPress, slideAnim, backdropAnim]);

  const closeSheet = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setVisible(false);
        callback?.();
      });
    },
    [slideAnim, backdropAnim]
  );

  const handleAction = (action: string) => {
    closeSheet(() => {
      if (action === 'rewards') {
        router.push('/rewards');
      }
    });
  };

  const contextValue = useMemo(() => ({ open: openSheet }), [openSheet]);

  return (
    <QuickActionsContext.Provider value={contextValue}>
      {children}

      <Modal transparent visible={visible} animationType="none" onRequestClose={() => closeSheet()}>
        <TouchableWithoutFeedback onPress={() => closeSheet()}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheetBackground,
            { transform: [{ translateY: slideAnim }], paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>{t('fab.quickActions')}</Text>

          <QuickActionRow
            styles={styles}
            icon={<Bell size={18} color={c.primary[400]} />}
            title={t('fab.addAlert')}
            subtitle={t('fab.addAlertSubtitle')}
            onPress={() => handleAction('alert')}
            accessibilityLabel={t('fab.addAlert')}
          />

          {hasFollow && (
            <QuickActionRow
              styles={styles}
              icon={<PlusCircle size={18} color={c.primary[400]} />}
              title={t('fab.addToWatchlist')}
              subtitle={t('fab.watchlistSubtitle')}
              onPress={() => handleAction('watchlist')}
              accessibilityLabel={t('fab.addToWatchlist')}
            />
          )}

          <QuickActionRow
            styles={styles}
            icon={<FileText size={18} color={c.success[500]} />}
            title={t('fab.submitNews')}
            subtitle={t('fab.submitNewsSubtitle')}
            onPress={() => handleAction('submit')}
            accessibilityLabel={t('fab.submitNews')}
          />

          {hasRewards && (
            <QuickActionRow
              styles={styles}
              icon={<Gift size={18} color={c.primary[400]} />}
              title={t('fab.rewards')}
              subtitle={t('fab.rewardsSubtitle')}
              onPress={() => handleAction('rewards')}
              accessibilityLabel={t('fab.rewards')}
            />
          )}
        </Animated.View>
      </Modal>
    </QuickActionsContext.Provider>
  );
};

/** @deprecated Use QuickActionsProvider */
export const FAB = QuickActionsProvider;

function buildStyles(tokens: ThemeTokens) {
  const { typography } = tokens;
  const accentBg = tokens.isDark ? tokens.colors.primary[900] : tokens.colors.primary[50];
  const rowBg = tokens.isDark ? tokens.bg : tokens.surface;
  const rowBorder = tokens.borderSubtle;

  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tokens.backdrop,
    },
    bottomSheetBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tokens.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 0.5,
      borderColor: rowBorder,
      overflow: 'hidden',
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.isDark ? tokens.borderStrong : tokens.colors.neutral[300],
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
      letterSpacing: 0.2,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    sheetAction: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: rowBorder,
      backgroundColor: rowBg,
      minHeight: 56,
    },
    sheetIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: accentBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: tokens.spacing.sm,
    },
    sheetActionText: {
      flex: 1,
      minWidth: 0,
    },
    sheetActionTitle: {
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typography.fontFamilies.sansSemiBold,
      letterSpacing: typography.letterSpacing.caption,
    },
    sheetActionSubtitle: {
      fontSize: typography.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typography.fontWeights.medium,
      fontFamily: typography.fontFamilies.sansMedium,
      letterSpacing: typography.letterSpacing.eyebrow * 0.5,
    },
  });
}

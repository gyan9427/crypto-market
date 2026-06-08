import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { AppButton } from '@/src/design-system/primitives/AppButton/AppButton';
import type { ThemeTokens } from '@/src/theme/theme';

export type DeleteAccountModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tokens: ThemeTokens;
};

const BULLET_KEYS = [
  'profile.deleteAccountBulletAccount',
  'profile.deleteAccountBulletPortfolio',
  'profile.deleteAccountBulletSocial',
  'profile.deleteAccountBulletNotifications',
] as const;

export function DeleteAccountModal({
  visible,
  onClose,
  onConfirm,
  tokens,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('profile.deleteAccountError');
      setError(message);
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>{t('profile.deleteAccountTitle')}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={loading}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('accessibility.close')}
                >
                  <X size={22} color={tokens.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={styles.warning} accessibilityRole="alert">
                  {t('profile.deleteAccountWarning')}
                </Text>

                <Text style={styles.sectionLabel}>{t('profile.deleteAccountBulletsTitle')}</Text>
                {BULLET_KEYS.map((key) => (
                  <View key={key} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>{'\u2022'}</Text>
                    <Text style={styles.bulletText}>{t(key)}</Text>
                  </View>
                ))}

                <Text style={styles.note}>{t('profile.deleteAccountBlockchainNote')}</Text>

                {error ? (
                  <Text style={styles.error} accessibilityRole="alert">
                    {error}
                  </Text>
                ) : null}
              </ScrollView>

              <View style={styles.actions}>
                <AppButton
                  variant="secondary"
                  label={t('profile.deleteAccountCancel')}
                  onPress={onClose}
                  disabled={loading}
                  fullWidth
                />
                <AppButton
                  variant="destructive"
                  label={t('profile.deleteAccountConfirm')}
                  onPress={() => void handleConfirm()}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function buildStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    sheet: {
      maxHeight: '80%',
      backgroundColor: tokens.bgElevated,
      borderTopLeftRadius: tokens.semantic.cardRadius,
      borderTopRightRadius: tokens.semantic.cardRadius,
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.md,
      borderWidth: tokens.isDark ? 1 : 0,
      borderColor: tokens.borderSubtle,
      borderBottomWidth: 0,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.spacing.sm,
    },
    title: {
      fontSize: tokens.typography.fontSizes.lg,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.colors.error[600],
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    warning: {
      fontSize: tokens.typography.fontSizes.md,
      lineHeight: 22,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sans,
      marginBottom: tokens.spacing.md,
    },
    sectionLabel: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
      marginBottom: tokens.spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: tokens.spacing.xs,
      paddingRight: tokens.spacing.sm,
    },
    bulletDot: {
      fontSize: tokens.typography.fontSizes.md,
      color: tokens.textMuted,
      marginRight: tokens.spacing.sm,
      lineHeight: 22,
    },
    bulletText: {
      flex: 1,
      fontSize: tokens.typography.fontSizes.sm,
      lineHeight: 22,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    note: {
      fontSize: tokens.typography.fontSizes.xs,
      lineHeight: 18,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sans,
      marginTop: tokens.spacing.md,
      marginBottom: tokens.spacing.md,
    },
    error: {
      fontSize: tokens.typography.fontSizes.sm,
      color: tokens.colors.error[600],
      fontFamily: tokens.typography.fontFamilies.sans,
      marginBottom: tokens.spacing.sm,
    },
    actions: {
      gap: tokens.spacing.sm,
      paddingTop: tokens.spacing.sm,
    },
  });
}

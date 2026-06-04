import React, { useMemo } from 'react';
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
import type { ThemeTokens } from '@/src/theme/theme';

export type AboutAppModalProps = {
  visible: boolean;
  onClose: () => void;
  tokens: ThemeTokens;
};

export function AboutAppModal({ visible, onClose, tokens }: AboutAppModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => buildStyles(tokens), [tokens]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>{t('profile.aboutSheetTitle')}</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('accessibility.close')}
                >
                  <X size={22} color={tokens.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={styles.version}>{t('profile.aboutVersion')}</Text>
                <Text style={styles.body}>{t('profile.aboutBody')}</Text>
                <Text style={styles.tagline}>{t('profile.aboutTagline')}</Text>
              </ScrollView>
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
      maxHeight: '72%',
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
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    version: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      color: tokens.colors.primary[600],
      fontFamily: tokens.typography.fontFamilies.sansMedium,
      marginBottom: tokens.spacing.md,
      letterSpacing: 0.3,
    },
    body: {
      fontSize: tokens.typography.fontSizes.md,
      lineHeight: 22,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sans,
      marginBottom: tokens.spacing.lg,
    },
    tagline: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingTop: tokens.spacing.sm,
      paddingBottom: tokens.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
  });
}

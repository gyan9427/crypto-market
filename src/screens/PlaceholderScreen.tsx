import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface PlaceholderScreenProps {
  title: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPlaceholderScreenStyles(tokens), [tokens]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{t('common.comingSoon')}</Text>
    </View>
  );
};

function buildPlaceholderScreenStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tokens.bg,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: tokens.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: tokens.textMuted,
    },
  });
}

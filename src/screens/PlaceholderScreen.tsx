import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AppText } from '@/src/design-system/primitives/AppText';
import { AppSurface } from '@/src/design-system/primitives/AppSurface';
interface PlaceholderScreenProps {
  title: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title }) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildPlaceholderScreenStyles(tokens), [tokens]);

  return (
    <AppSurface variant="default" style={styles.container}>
      <AppText variant="heading-xl" color="strong">
        {title}
      </AppText>
      <AppText variant="body-m" color="muted" style={styles.subtitleSpacing}>
        {t('common.comingSoon')}
      </AppText>
    </AppSurface>
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
    subtitleSpacing: {
      marginTop: tokens.spacing.sm,
    },
  });
}

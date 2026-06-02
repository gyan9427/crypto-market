import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { AppText } from '@/src/design-system/primitives/AppText';
import { AppSurface } from '@/src/design-system/primitives/AppSurface';
import { useMemo } from 'react';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: tokens.spacing.lg,
          backgroundColor: tokens.bg,
        },
        link: {
          marginTop: tokens.spacing.md,
          paddingVertical: tokens.spacing.md,
        },
      }),
    [tokens]
  );

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <AppSurface variant="default" style={styles.container}>
        <AppText variant="heading-l" color="strong">
          {t('notFound.message')}
        </AppText>
        <Link href="/" style={styles.link}>
          <AppText variant="body-m" color="link">
            {t('notFound.goHome')}
          </AppText>
        </Link>
      </AppSurface>
    </>
  );
}

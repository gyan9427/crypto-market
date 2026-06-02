import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/src/screens/PlaceholderScreen';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function RewardsTab() {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: tokens.bg,
        },
      }),
    [tokens.bg]
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <PlaceholderScreen title={t('nav.rewards')} />
    </SafeAreaView>
  );
}

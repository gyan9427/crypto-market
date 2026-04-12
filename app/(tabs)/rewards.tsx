import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '@/src/screens/PlaceholderScreen';

export default function RewardsTab() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <PlaceholderScreen title={t('nav.rewards')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

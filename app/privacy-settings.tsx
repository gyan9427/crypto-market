import { PrivacySettingsScreen } from '@/src/privacy/PrivacySettingsScreen';
import { Stack } from 'expo-router';

export default function PrivacySettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy', headerShown: true }} />
      <PrivacySettingsScreen />
    </>
  );
}

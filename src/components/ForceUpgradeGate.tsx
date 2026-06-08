import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';

const STORE_URL = process.env.EXPO_PUBLIC_STORE_URL || 'https://play.google.com/store';

interface ForceUpgradeGateProps {
  visible: boolean;
}

export function ForceUpgradeGate({ visible }: ForceUpgradeGateProps) {
  const { tokens } = useAppTheme();

  return (
    <Modal visible={visible} animationType="fade">
      <View style={[styles.container, { backgroundColor: tokens.bg }]}>
        <Text style={[styles.title, { color: tokens.colors.neutral[50] }]}>
          Update required
        </Text>
        <Text style={[styles.body, { color: tokens.colors.neutral[300] }]}>
          This version of NAYFT is no longer supported. Please update to continue.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tokens.colors.primary[500] }]}
          onPress={() => Linking.openURL(STORE_URL)}
        >
          <Text style={styles.buttonText}>Update app</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  button: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

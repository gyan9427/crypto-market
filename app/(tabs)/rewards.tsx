import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { PlaceholderScreen } from '@/src/screens/PlaceholderScreen';
import { colors } from '@/src/theme/theme';

export default function RewardsTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.neutral[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
      </View>
      <PlaceholderScreen title="Rewards" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
});

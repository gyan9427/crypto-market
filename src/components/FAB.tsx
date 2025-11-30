import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Plus, Bell, PlusCircle, FileText } from 'lucide-react-native';
import { colors, shadows } from '../theme/theme';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface FABProps {
  onPress?: () => void;
}

export const FAB: React.FC<FABProps> = ({ onPress }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handlePress = () => {
    bottomSheetRef.current?.expand();
    onPress?.();
  };

  const handleSheetClose = () => {
    // Sheet closed
  };

  const handleAction = (action: string) => {
    console.log(`Action: ${action}`);
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Add action"
          activeOpacity={0.9}
        >
          <Plus size={28} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['35%']}
        enablePanDownToClose
        onClose={handleSheetClose}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.sheetTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.sheetAction}
            onPress={() => handleAction('alert')}
            accessibilityRole="button"
            accessibilityLabel="Add Alert"
          >
            <View style={styles.sheetIconContainer}>
              <Bell size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.sheetActionText}>
              <Text style={styles.sheetActionTitle}>Add Alert</Text>
              <Text style={styles.sheetActionSubtitle}>Set price alerts for coins</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetAction}
            onPress={() => handleAction('watchlist')}
            accessibilityRole="button"
            accessibilityLabel="Add to Watchlist"
          >
            <View style={styles.sheetIconContainer}>
              <PlusCircle size={24} color={colors.accent[500]} />
            </View>
            <View style={styles.sheetActionText}>
              <Text style={styles.sheetActionTitle}>Add to Watchlist</Text>
              <Text style={styles.sheetActionSubtitle}>Track your favorite coins</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetAction}
            onPress={() => handleAction('submit')}
            accessibilityRole="button"
            accessibilityLabel="Submit News"
          >
            <View style={styles.sheetIconContainer}>
              <FileText size={24} color={colors.success[500]} />
            </View>
            <View style={styles.sheetActionText}>
              <Text style={styles.sheetActionTitle}>Submit News</Text>
              <Text style={styles.sheetActionSubtitle}>Share crypto news with community</Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 20,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 60,
  },
  sheetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sheetActionText: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  sheetActionSubtitle: {
    fontSize: 13,
    color: colors.neutral[500],
  },
});

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/state/useAuthStore';
import { colors, spacing, borderRadius, typography, shadows, semantic } from '@/src/theme/theme';
import { LogOut, Shield, Info, User as UserIcon, Bookmark } from 'lucide-react-native';

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

interface ProfileMenuItemProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onPress: () => void;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  label,
  description,
  icon,
  danger,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        {icon && <View style={styles.menuIcon}>{icon}</View>}
        <View>
          <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
          {description && <Text style={styles.menuDescription}>{description}</Text>}
        </View>
      </View>
      <Text style={[styles.menuChevron, danger && styles.menuLabelDanger]}>{'›'}</Text>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName = user?.username || user?.name || 'User';
  const email = (user as any)?.email;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {email && <Text style={styles.email}>{email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ProfileMenuItem
            label="Account details"
            description="View your basic account information"
            icon={<UserIcon size={18} color={colors.neutral[600]} />}
            onPress={() => {
              // TODO: navigate to account details screen
              console.log('Account pressed');
            }}
          />
          <ProfileMenuItem
            label="Security"
            description="Password and sign-in options"
            icon={<Shield size={18} color={colors.neutral[600]} />}
            onPress={() => {
              // TODO: navigate to security settings
              console.log('Security pressed');
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collections</Text>
          <ProfileMenuItem
            label="News Boards"
            description="Your saved article collections"
            icon={<Bookmark size={18} color={colors.neutral[600]} />}
            onPress={() => router.push('/news-boards' as never)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <ProfileMenuItem
            label="About this app"
            description="Learn more about Crypto Market"
            icon={<Info size={18} color={colors.neutral[600]} />}
            onPress={() => {
              // TODO: show about modal or screen
              console.log('About pressed');
            }}
          />
        </View>

        <View style={styles.section}>
          <ProfileMenuItem
            label="Logout"
            description="Sign out of your account"
            icon={<LogOut size={18} color={colors.error[500]} />}
            danger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  name: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: 4,
  },
  email: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  section: {
    backgroundColor: semantic.surface,
    borderRadius: semantic.cardRadius,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
    ...semantic.cardShadow,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: spacing.sm,
  },
  menuLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium,
  },
  menuLabelDanger: {
    color: colors.error[600],
  },
  menuDescription: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  menuChevron: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[400],
    marginLeft: spacing.sm,
  },
});


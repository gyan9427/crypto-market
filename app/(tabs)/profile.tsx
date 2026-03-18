import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/state/useAuthStore';
import { colors, spacing, borderRadius, typography, shadows, semantic } from '@/src/theme/theme';
import { LogOut, Shield, Info, User as UserIcon, Bookmark } from 'lucide-react-native';
import {
  followUser,
  unfollowUser,
  getFollowedUsers,
  getUserFollowStats,
  searchUsers,
} from '@/src/services/api';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<{ id: string; username: string }[]>([]);
  const [followingUsers, setFollowingUsers] = React.useState<{ id: string; username: string }[]>([]);
  const [stats, setStats] = React.useState<{
    followersCount: number;
    followingUsersCount: number;
    followingCoinsCount: number;
  } | null>(null);
  const [socialLoading, setSocialLoading] = React.useState(false);
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const displayName = user?.username || user?.name || 'User';
  const email = (user as any)?.email;

  const refreshSocialData = React.useCallback(async () => {
    if (!user?.id) return;
    setSocialLoading(true);
    try {
      const [followedUsers, followStats] = await Promise.all([
        getFollowedUsers(),
        getUserFollowStats(user.id),
      ]);
      setFollowingUsers(followedUsers.map((u) => ({ id: u.id, username: u.username })));
      setStats({
        followersCount: followStats.followersCount ?? 0,
        followingUsersCount: followStats.followingUsersCount ?? 0,
        followingCoinsCount: followStats.followingCoinsCount ?? 0,
      });
    } catch (error) {
      console.warn('Failed to load social data:', error);
    } finally {
      setSocialLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    refreshSocialData();
  }, [refreshSocialData]);

  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(searchQuery.trim(), 8);
        setSearchResults(users.filter((item) => item.id !== user?.id));
      } catch (error) {
        console.warn('User search failed:', error);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleToggleUserFollow = async (targetUserId: string, currentlyFollowing: boolean) => {
    setUpdatingUserId(targetUserId);
    try {
      if (currentlyFollowing) {
        await unfollowUser(targetUserId);
        setFollowingUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        await followUser(targetUserId);
        const userFromSearch = searchResults.find((u) => u.id === targetUserId);
        if (userFromSearch) {
          setFollowingUsers((prev) =>
            prev.some((u) => u.id === targetUserId) ? prev : [userFromSearch, ...prev]
          );
        }
      }
      await refreshSocialData();
    } catch (error) {
      console.warn('Failed to update follow status:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {email && <Text style={styles.email}>{email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social</Text>
          {socialLoading ? (
            <View style={styles.socialLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : (
            <View style={styles.socialStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Followers</Text>
                <Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Following users</Text>
                <Text style={styles.statValue}>{stats?.followingUsersCount ?? 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Following coins</Text>
                <Text style={styles.statValue}>{stats?.followingCoinsCount ?? 0}</Text>
              </View>
            </View>
          )}
          <View style={styles.searchWrap}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users to follow..."
              placeholderTextColor={colors.neutral[400]}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {searchResults.map((item) => {
            const isFollowingUser = followingUsers.some((u) => u.id === item.id);
            return (
              <View key={item.id} style={styles.followRow}>
                <Text style={styles.followUsername}>@{item.username}</Text>
                <TouchableOpacity
                  style={[styles.followChip, isFollowingUser && styles.followingChip]}
                  onPress={() => handleToggleUserFollow(item.id, isFollowingUser)}
                  disabled={updatingUserId === item.id}
                >
                  <Text style={[styles.followChipText, isFollowingUser && styles.followingChipText]}>
                    {updatingUserId === item.id ? '...' : isFollowingUser ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {followingUsers.length > 0 && (
            <View style={styles.followingList}>
              <Text style={styles.subSectionTitle}>Following</Text>
              {followingUsers.slice(0, 8).map((item) => (
                <View key={item.id} style={styles.followingUserRow}>
                  <Text style={styles.followUsername}>@{item.username}</Text>
                  <TouchableOpacity
                    style={[styles.followChip, styles.followingChip]}
                    onPress={() => handleToggleUserFollow(item.id, true)}
                    disabled={updatingUserId === item.id}
                  >
                    <Text style={[styles.followChipText, styles.followingChipText]}>
                      {updatingUserId === item.id ? '...' : 'Unfollow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
  socialLoadingRow: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    height: 40,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    color: colors.neutral[900],
  },
  followRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  followUsername: {
    color: colors.neutral[800],
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  followChip: {
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 84,
    alignItems: 'center',
  },
  followingChip: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[300],
  },
  followChipText: {
    color: '#fff',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  followingChipText: {
    color: colors.neutral[700],
  },
  followingList: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  subSectionTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  followingUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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


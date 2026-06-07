import React, { useCallback, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCollapsibleNavHeaderScrollHandlers } from '@/src/hooks/useCollapsibleNavHeader';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/src/state/useAuthStore';
import { useAppStore } from '@/src/state/useAppStore';
import { getLanguageOption, type SupportedLanguage } from '@/src/constants/languages';
import { LanguagePickerSheet } from '@/src/components/LanguagePickerSheet';
import { AboutAppModal } from '@/src/components/AboutAppModal';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';
import type { ThemePreference } from '@/src/types';
import { SegmentToggle } from '@/src/components/SegmentToggle';
import { LogOut, Shield, Info, User as UserIcon, Bookmark, Bell, Trash2, Lock } from 'lucide-react-native';
import {
  followUser,
  unfollowUser,
  getFollowedUsers,
  getUserFollowStats,
  deleteAccount,
} from '@/src/services/api';
import { DeleteAccountModal } from '@/src/components/DeleteAccountModal';
import { useNotificationStore } from '@/src/state/useNotificationStore';

const PREF_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

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
  tokens: ThemeTokens;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  label,
  description,
  icon,
  danger,
  onPress,
  tokens,
}) => {
  const s = useMemo(() => menuStyles(tokens), [tokens]);
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={s.menuItemLeft}>
        {icon && <View style={s.menuIcon}>{icon}</View>}
        <View>
          <Text style={[s.menuLabel, danger && s.menuLabelDanger]}>{label}</Text>
          {description && <Text style={s.menuDescription}>{description}</Text>}
        </View>
      </View>
      <Text style={[s.menuChevron, danger && s.menuLabelDanger]}>{'›'}</Text>
    </TouchableOpacity>
  );
};

function menuStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuIcon: {
      marginRight: tokens.spacing.sm,
    },
    menuLabel: {
      fontSize: tokens.typography.fontSizes.md,
      color: tokens.text,
      fontWeight: tokens.typography.fontWeights.medium,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
    },
    menuLabelDanger: {
      color: tokens.colors.error[600],
    },
    menuDescription: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: 2,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    menuChevron: {
      fontSize: tokens.typography.fontSizes.lg,
      color: tokens.textMuted,
      marginLeft: tokens.spacing.sm,
    },
  });
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { tokens, preference, setPreference } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setFeedFilter = useAppStore((state) => state.setFeedFilter);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const designSystemV2Dev = useAppStore((state) => state.designSystemV2Dev);
  const setDesignSystemV2Dev = useAppStore((state) => state.setDesignSystemV2Dev);
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const [aboutVisible, setAboutVisible] = React.useState(false);
  const [deleteVisible, setDeleteVisible] = React.useState(false);
  const [followingUsers, setFollowingUsers] = React.useState<{ id: string; username: string }[]>([]);
  const [stats, setStats] = React.useState<{
    followersCount: number;
    followingUsersCount: number;
    followingCoinsCount: number;
  } | null>(null);
  const [socialLoading, setSocialLoading] = React.useState(false);
  const [updatingUserId, setUpdatingUserId] = React.useState<string | null>(null);

  const styles = useMemo(() => buildScreenStyles(tokens), [tokens]);
  const collapsibleScrollHandlers = useCollapsibleNavHeaderScrollHandlers();

  const prefIndex = PREF_ORDER.indexOf(preference);
  const appearanceIndex = prefIndex >= 0 ? prefIndex : 0;

  const currentLanguageMeta = useMemo(() => getLanguageOption(language), [language]);

  const handleLanguageSelect = useCallback(
    async (code: SupportedLanguage) => {
      await setLanguage(code);
      languageSheetRef.current?.dismiss();
    },
    [setLanguage]
  );

  const handleLogout = async () => {
    await logout();
    setFeedFilter('explore');
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    useNotificationStore.getState().reset();
    await logout();
    setFeedFilter('explore');
    router.replace('/login');
  };

  const displayName = user?.username || user?.name || 'User';
  const email = (user as { email?: string })?.email;

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

  const handleToggleUserFollow = async (targetUserId: string, currentlyFollowing: boolean) => {
    setUpdatingUserId(targetUserId);
    try {
      if (currentlyFollowing) {
        await unfollowUser(targetUserId);
        setFollowingUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      } else {
        await followUser(targetUserId);
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
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        {...collapsibleScrollHandlers}
      >
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {email && <Text style={styles.email}>{email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.appearance')}</Text>
          <Text style={styles.appearanceHint}>{t('profile.appearanceHint')}</Text>
          <View style={styles.appearanceToggleWrap}>
            <SegmentToggle
              flush
              options={[t('common.themeSystem'), t('common.themeLight'), t('common.themeDark')]}
              selectedIndex={appearanceIndex}
              onSelect={(i) => setPreference(PREF_ORDER[i] ?? 'system')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ProfileMenuItem
            label="Design system v2"
            description={
              designSystemV2Dev ? 'Enabled (dev override)' : 'Off — or enable design_system_v2 flag'
            }
            onPress={() => setDesignSystemV2Dev(!designSystemV2Dev)}
            tokens={tokens}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.languageSection')}</Text>
          <Text style={styles.appearanceHint}>{t('profile.languageHint')}</Text>
          <TouchableOpacity
            style={styles.languageRow}
            onPress={() => languageSheetRef.current?.present()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${t('profile.languageSection')}, ${currentLanguageMeta?.englishLabel ?? language}`}
            accessibilityHint={t('profile.languageHint')}
          >
            <View style={styles.languageRowLeft}>
              <Text style={styles.languageRowPrimary} numberOfLines={1}>
                {currentLanguageMeta?.label ?? language}
              </Text>
              <Text style={styles.languageRowSecondary} numberOfLines={1}>
                {currentLanguageMeta?.englishLabel ?? language}
              </Text>
            </View>
            <Text style={styles.languageRowChevron}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        <LanguagePickerSheet
          ref={languageSheetRef}
          tokens={tokens}
          currentLanguage={language}
          onSelectLanguage={handleLanguageSelect}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.social')}</Text>
          {socialLoading ? (
            <View style={styles.socialLoadingRow}>
              <ActivityIndicator size="small" color={tokens.colors.primary[500]} />
            </View>
          ) : (
            <View style={styles.socialStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                <Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('profile.followingUsers')}</Text>
                <Text style={styles.statValue}>{stats?.followingUsersCount ?? 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('profile.followingCoins')}</Text>
                <Text style={styles.statValue}>{stats?.followingCoinsCount ?? 0}</Text>
              </View>
            </View>
          )}
          {followingUsers.length > 0 && (
            <View style={styles.followingList}>
              <Text style={styles.subSectionTitle}>{t('profile.following')}</Text>
              {followingUsers.slice(0, 8).map((item) => (
                <View key={item.id} style={styles.followingUserRow}>
                  <Text style={styles.followUsername}>@{item.username}</Text>
                  <TouchableOpacity
                    style={[styles.followChip, styles.followingChip]}
                    onPress={() => handleToggleUserFollow(item.id, true)}
                    disabled={updatingUserId === item.id}
                  >
                    <Text style={[styles.followChipText, styles.followingChipText]}>
                      {updatingUserId === item.id ? t('common.ellipsis') : t('profile.unfollow')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.accountDetails')}
            description={t('profile.accountDetailsDesc')}
            icon={<UserIcon size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => {
              console.log('Account pressed');
            }}
          />
          <ProfileMenuItem
            tokens={tokens}
            label="Notifications"
            description="Alerts, wallet activity, and social updates"
            icon={<Bell size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => router.push('/(tabs)/notifications' as never)}
          />
          <ProfileMenuItem
            tokens={tokens}
            label={t('privacy.settingsTitle', 'Privacy settings')}
            description={t('privacy.settingsDesc', 'Analytics, personalization, and data choices')}
            icon={<Lock size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => router.push('/privacy-settings' as never)}
          />
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.security')}
            description={t('profile.securityDesc')}
            icon={<Shield size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => {
              console.log('Security pressed');
            }}
          />
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.deleteAccount')}
            description={t('profile.deleteAccountDesc')}
            icon={<Trash2 size={18} color={tokens.colors.error[500]} />}
            danger
            onPress={() => setDeleteVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.collections')}</Text>
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.newsBoards')}
            description={t('profile.newsBoardsDesc')}
            icon={<Bookmark size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => router.push('/news-boards' as never)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.aboutApp')}
            description={t('profile.aboutAppDesc')}
            icon={<Info size={18} color={tokens.colors.neutral[600]} />}
            onPress={() => setAboutVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <ProfileMenuItem
            tokens={tokens}
            label={t('profile.logout')}
            description={t('profile.logoutDesc')}
            icon={<LogOut size={18} color={tokens.colors.error[500]} />}
            danger
            onPress={handleLogout}
          />
        </View>
      </Animated.ScrollView>

      <AboutAppModal
        visible={aboutVisible}
        onClose={() => setAboutVisible(false)}
        tokens={tokens}
      />

      <DeleteAccountModal
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onConfirm={handleDeleteAccount}
        tokens={tokens}
      />
    </SafeAreaView>
  );
}

function buildScreenStyles(tokens: ThemeTokens) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    container: {
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.lg,
      paddingBottom: tokens.spacing.xl,
    },
    card: {
      alignItems: 'center',
      marginBottom: tokens.spacing.xl,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: tokens.colors.primary[100],
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing.sm,
      ...tokens.shadows.md,
    },
    avatarText: {
      fontSize: tokens.typography.fontSizes.xl,
      fontWeight: tokens.typography.fontWeights.bold,
      color: tokens.colors.primary[700],
      fontFamily: tokens.typography.fontFamilies.sansBold,
    },
    name: {
      fontSize: tokens.typography.fontSizes.lg,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.text,
      marginBottom: 4,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    email: {
      fontSize: tokens.typography.fontSizes.sm,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    section: {
      backgroundColor: tokens.bgElevated,
      borderRadius: tokens.semantic.cardRadius,
      paddingVertical: tokens.spacing.xs,
      marginBottom: tokens.spacing.lg,
      ...tokens.semantic.cardShadow,
      borderWidth: tokens.isDark ? 1 : 0,
      borderColor: tokens.borderSubtle,
    },
    appearanceHint: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      paddingHorizontal: tokens.spacing.md,
      paddingBottom: tokens.spacing.sm,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    appearanceToggleWrap: {
      paddingHorizontal: tokens.spacing.md,
      paddingBottom: tokens.spacing.sm,
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      marginHorizontal: tokens.spacing.sm,
      marginBottom: tokens.spacing.sm,
      borderRadius: tokens.semantic.cardRadiusSmall,
    },
    languageRowLeft: {
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    languageRowPrimary: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    languageRowSecondary: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      marginTop: 2,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    languageRowChevron: {
      fontSize: tokens.typography.fontSizes.xl,
      color: tokens.textMuted,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    socialLoadingRow: {
      paddingVertical: tokens.spacing.md,
      alignItems: 'center',
    },
    socialStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing.md,
      paddingBottom: tokens.spacing.sm,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      marginBottom: 2,
      textAlign: 'center',
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    statValue: {
      fontSize: tokens.typography.fontSizes.md,
      fontWeight: tokens.typography.fontWeights.semibold,
      color: tokens.text,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    followUsername: {
      color: tokens.text,
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
    },
    followChip: {
      borderWidth: 1,
      borderColor: tokens.colors.primary[500],
      backgroundColor: tokens.colors.primary[500],
      borderRadius: tokens.borderRadius.button,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 4,
      minWidth: 84,
      alignItems: 'center',
    },
    followingChip: {
      backgroundColor: tokens.isDark ? tokens.colors.neutral[200] : tokens.colors.neutral[100],
      borderColor: tokens.colors.neutral[300],
    },
    followChipText: {
      color: '#fff',
      fontSize: tokens.typography.fontSizes.xs,
      fontWeight: tokens.typography.fontWeights.semibold,
      fontFamily: tokens.typography.fontFamilies.sansSemiBold,
    },
    followingChipText: {
      color: tokens.text,
    },
    followingList: {
      paddingTop: tokens.spacing.xs,
      paddingBottom: tokens.spacing.sm,
    },
    subSectionTitle: {
      fontSize: tokens.typography.fontSizes.xs,
      color: tokens.textMuted,
      paddingHorizontal: tokens.spacing.md,
      paddingBottom: tokens.spacing.xs,
      fontFamily: tokens.typography.fontFamilies.sans,
    },
    followingUserRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.xs,
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSizes.sm,
      fontWeight: tokens.typography.fontWeights.medium,
      color: tokens.textMuted,
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.xs,
      fontFamily: tokens.typography.fontFamilies.sansMedium,
    },
  });
}

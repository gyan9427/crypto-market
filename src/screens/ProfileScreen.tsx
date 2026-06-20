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
      {icon && <View style={s.menuIcon}>{icon}</View>}
      <View style={s.menuContent}>
        <Text style={[s.menuLabel, danger && s.menuLabelDanger]} numberOfLines={1}>
          {label}
        </Text>
        {description && (
          <Text style={s.menuDescription} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

function menuStyles(tokens: ThemeTokens) {
  const typo = tokens.typography;
  return StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
      minHeight: 56,
    },
    menuIcon: {
      marginRight: tokens.spacing.sm,
    },
    menuContent: {
      flex: 1,
      minWidth: 0,
    },
    menuLabel: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      color: tokens.text,
      letterSpacing: typo.letterSpacing.caption,
    },
    menuLabelDanger: {
      color: tokens.colors.error[600],
    },
    menuDescription: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
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
  const appearanceOptions = [t('common.themeSystem'), t('common.themeLight'), t('common.themeDark')];

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
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {email ? (
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            ) : (
              <Text style={styles.email} numberOfLines={1}>
                @{displayName}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('profile.appearance')}</Text>
        <View style={styles.tabRow}>
          {appearanceOptions.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[styles.tab, appearanceIndex === index && styles.tabActive]}
              onPress={() => setPreference(PREF_ORDER[index] ?? 'system')}
              accessibilityRole="button"
              accessibilityState={{ selected: appearanceIndex === index }}
            >
              <Text style={[styles.tabText, appearanceIndex === index && styles.tabTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('profile.languageSection')}</Text>
        <TouchableOpacity
          style={styles.flatRow}
          onPress={() => languageSheetRef.current?.present()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${t('profile.languageSection')}, ${currentLanguageMeta?.englishLabel ?? language}`}
          accessibilityHint={t('profile.languageHint')}
        >
          <View style={styles.identity}>
            <Text style={styles.rowPrimary} numberOfLines={1}>
              {currentLanguageMeta?.label ?? language}
            </Text>
            <Text style={styles.rowSecondary} numberOfLines={1}>
              {currentLanguageMeta?.englishLabel ?? language}
            </Text>
          </View>
        </TouchableOpacity>

        <ProfileMenuItem
          label="Design system v2"
          description={
            designSystemV2Dev ? 'Enabled (dev override)' : 'Off — or enable design_system_v2 flag'
          }
          onPress={() => setDesignSystemV2Dev(!designSystemV2Dev)}
          tokens={tokens}
        />

        <LanguagePickerSheet
          ref={languageSheetRef}
          tokens={tokens}
          currentLanguage={language}
          onSelectLanguage={handleLanguageSelect}
        />

        <Text style={styles.sectionTitle}>{t('profile.social')}</Text>
        {socialLoading ? (
          <View style={styles.socialLoadingRow}>
            <ActivityIndicator size="small" color={tokens.link} />
          </View>
        ) : (
          <View style={styles.socialStatsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>{t('profile.followers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.followingUsersCount ?? 0}</Text>
              <Text style={styles.statLabel}>{t('profile.followingUsers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.followingCoinsCount ?? 0}</Text>
              <Text style={styles.statLabel}>{t('profile.followingCoins')}</Text>
            </View>
          </View>
        )}
        {followingUsers.length > 0 && (
          <>
            <Text style={styles.listLabel}>{t('profile.following')}</Text>
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
          </>
        )}

        <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.accountDetails')}
          description={t('profile.accountDetailsDesc')}
          icon={<UserIcon size={18} color={tokens.textMuted} />}
          onPress={() => {
            console.log('Account pressed');
          }}
        />
        <ProfileMenuItem
          tokens={tokens}
          label="Notifications"
          description="Alerts, wallet activity, and social updates"
          icon={<Bell size={18} color={tokens.textMuted} />}
          onPress={() => router.push('/notification-preferences' as never)}
        />
        <ProfileMenuItem
          tokens={tokens}
          label={t('privacy.settingsTitle', 'Privacy settings')}
          description={t('privacy.settingsDesc', 'Analytics, personalization, and data choices')}
          icon={<Lock size={18} color={tokens.textMuted} />}
          onPress={() => router.push('/privacy-settings' as never)}
        />
        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.security')}
          description={t('profile.securityDesc')}
          icon={<Shield size={18} color={tokens.textMuted} />}
          onPress={() => router.push('/change-password' as never)}
        />
        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.deleteAccount')}
          description={t('profile.deleteAccountDesc')}
          icon={<Trash2 size={18} color={tokens.colors.error[500]} />}
          danger
          onPress={() => setDeleteVisible(true)}
        />

        <Text style={styles.sectionTitle}>{t('profile.collections')}</Text>
        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.newsBoards')}
          description={t('profile.newsBoardsDesc')}
          icon={<Bookmark size={18} color={tokens.textMuted} />}
          onPress={() => router.push('/news-boards' as never)}
        />

        <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.aboutApp')}
          description={t('profile.aboutAppDesc')}
          icon={<Info size={18} color={tokens.textMuted} />}
          onPress={() => setAboutVisible(true)}
        />

        <ProfileMenuItem
          tokens={tokens}
          label={t('profile.logout')}
          description={t('profile.logoutDesc')}
          icon={<LogOut size={18} color={tokens.colors.error[500]} />}
          danger
          onPress={handleLogout}
        />
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
  const typo = tokens.typography;
  const accent = tokens.link;
  const accentBg = tokens.isDark ? 'rgba(99,131,255,0.18)' : 'rgba(99,131,255,0.12)';

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    container: {
      paddingBottom: 96,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: accentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.sm,
    },
    avatarText: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.bold,
      color: accent,
      fontFamily: typo.fontFamilies.sansBold,
    },
    identity: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
      letterSpacing: typo.letterSpacing.caption,
    },
    email: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: tokens.textMuted,
      letterSpacing: 0.2,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    listLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.textMuted,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
      letterSpacing: 0.2,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: accentBg,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '500',
      color: tokens.textMuted,
    },
    tabTextActive: {
      color: accent,
    },
    flatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
      minHeight: 56,
    },
    rowPrimary: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
      letterSpacing: typo.letterSpacing.caption,
    },
    rowSecondary: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 2,
      fontWeight: typo.fontWeights.medium,
      fontFamily: typo.fontFamilies.sansMedium,
      letterSpacing: typo.letterSpacing.eyebrow * 0.5,
    },
    socialLoadingRow: {
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
    },
    socialStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: typo.fontSizes.badge,
      color: tokens.textMuted,
      marginTop: 4,
      textAlign: 'center',
      fontFamily: typo.fontFamilies.sans,
    },
    statValue: {
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      color: tokens.text,
      fontFamily: typo.fontFamilies.sansSemiBold,
      fontVariant: ['tabular-nums'],
    },
    followUsername: {
      color: tokens.text,
      fontSize: typo.fontSizes.sm,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
      flex: 1,
      marginRight: tokens.spacing.sm,
    },
    followChip: {
      borderWidth: 1,
      borderColor: accent,
      backgroundColor: accent,
      borderRadius: 8,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 4,
      minWidth: 84,
      alignItems: 'center',
    },
    followingChip: {
      backgroundColor: accentBg,
      borderColor: tokens.isDark ? 'rgba(99,131,255,0.35)' : 'rgba(99,131,255,0.25)',
    },
    followChipText: {
      color: tokens.colors.white,
      fontSize: typo.fontSizes.badge,
      fontWeight: typo.fontWeights.semibold,
      fontFamily: typo.fontFamilies.sansSemiBold,
    },
    followingChipText: {
      color: accent,
    },
    followingUserRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: tokens.isDark ? 'rgba(255,255,255,0.06)' : tokens.borderSubtle,
      backgroundColor: tokens.isDark ? tokens.bg : tokens.surface,
      minHeight: 56,
    },
  });
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { searchUsers } from '../services/api';
import { MENTION_AVATAR_COLORS } from '@/src/theme/chartPalette';
import type { AppPalette, ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface MentionCandidate {
  id: string;
  username: string;
}

interface MentionAutocompleteProps {
  query: string;
  localCandidates: MentionCandidate[];
  onSelect: (user: MentionCandidate) => void;
}

function avatarPalette(c: AppPalette): string[] {
  return [
    c.primary[500],
    c.accent[500],
    c.success[500],
    ...MENTION_AVATAR_COLORS,
  ];
}

function avatarColor(username: string, c: AppPalette): string {
  const AVATAR_COLORS = avatarPalette(c);
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  query,
  localCandidates,
  onSelect,
}) => {
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildMentionAutocompleteStyles(tokens), [tokens]);
  const c = tokens.colors;

  const [remoteResults, setRemoteResults] = useState<MentionCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localMatches = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return localCandidates.slice(0, 5);
    return localCandidates
      .filter((cand) => cand.username.toLowerCase().startsWith(q))
      .slice(0, 5);
  }, [query, localCandidates]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2 || localMatches.length >= 3) {
      setRemoteResults([]);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(query, 5);
        setRemoteResults(results);
      } catch {
        setRemoteResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, localMatches.length]);

  const merged = useMemo(() => {
    const seen = new Set(localMatches.map((cand) => cand.id));
    const combined = [...localMatches];
    for (const r of remoteResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    }
    return combined.slice(0, 5);
  }, [localMatches, remoteResults]);

  if (merged.length === 0 && !loading) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={merged}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.username, c) }]}>
              <Text style={styles.avatarText}>
                {item.username[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.username}>@{item.username}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color={c.primary[500]}
              style={styles.loader}
            />
          ) : null
        }
      />
    </View>
  );
};

function buildMentionAutocompleteStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  return StyleSheet.create({
    container: {
      backgroundColor: tokens.surface,
      borderTopWidth: 1,
      borderTopColor: tokens.borderSubtle,
      maxHeight: 220,
      ...tokens.shadows.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s.md,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.neutral[100],
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    avatarText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.white,
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
      color: c.neutral[800],
    },
    loader: {
      paddingVertical: 8,
    },
  });
}

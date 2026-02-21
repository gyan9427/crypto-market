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
import { colors, spacing, shadows } from '../theme/theme';

interface MentionCandidate {
  id: string;
  username: string;
}

interface MentionAutocompleteProps {
  query: string;
  localCandidates: MentionCandidate[];
  onSelect: (user: MentionCandidate) => void;
}

const AVATAR_COLORS = [
  colors.primary[500],
  colors.accent[500],
  colors.success[500],
  '#3b82f6',
  '#f59e0b',
  '#06b6d4',
];

function avatarColor(username: string): string {
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
  const [remoteResults, setRemoteResults] = useState<MentionCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localMatches = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return localCandidates.slice(0, 5);
    return localCandidates
      .filter((c) => c.username.toLowerCase().startsWith(q))
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
    const seen = new Set(localMatches.map((c) => c.id));
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
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.username) }]}>
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
              color={colors.primary[500]}
              style={styles.loader}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    maxHeight: 220,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
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
    color: '#fff',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  loader: {
    paddingVertical: 8,
  },
});

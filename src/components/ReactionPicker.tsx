import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { REACTIONS, ReactionType, ReactionCounts } from '../types';
import { colors, spacing, borderRadius } from '../theme/theme';
import { abbreviateNumber } from '../utils/format';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ReactionPickerProps {
  reactions?: ReactionCounts;
  userReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
}

function getTopReactions(
  reactions: ReactionCounts | undefined
): { emoji: string; count: number }[] {
  if (!reactions) return [];
  return REACTIONS.map((r) => ({
    emoji: r.emoji,
    count: reactions[r.type] ?? 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  reactions,
  userReaction,
  onReact,
}) => {
  const [expanded, setExpanded] = useState(false);

  const total = reactions?.total ?? 0;
  const topReactions = getTopReactions(reactions);
  const activeConfig = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)
    : null;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleReact = (type: ReactionType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
    onReact(type);
  };

  if (expanded) {
    return (
      <View style={styles.expandedContainer}>
        {REACTIONS.map((r) => {
          const isActive = userReaction === r.type;
          return (
            <TouchableOpacity
              key={r.type}
              style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
              onPress={() => handleReact(r.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text
                style={[
                  styles.reactionLabel,
                  isActive && styles.reactionLabelActive,
                ]}
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.compactButton, activeConfig && styles.compactButtonActive]}
      onPress={handleToggle}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {activeConfig ? (
        <Text style={styles.compactEmoji}>{activeConfig.emoji}</Text>
      ) : topReactions.length > 0 ? (
        <View style={styles.emojiStack}>
          {topReactions.map((r, i) => (
            <Text key={i} style={styles.stackEmoji}>
              {r.emoji}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.compactEmoji}>{REACTIONS[0].emoji}</Text>
      )}
      <Text
        style={[styles.compactCount, activeConfig && styles.compactCountActive]}
      >
        {abbreviateNumber(total)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  expandedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
  },
  reactionButtonActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[600],
    marginLeft: 4,
  },
  reactionLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  compactButtonActive: {},
  compactEmoji: {
    fontSize: 18,
  },
  emojiStack: {
    flexDirection: 'row',
  },
  stackEmoji: {
    fontSize: 14,
    marginRight: -2,
  },
  compactCount: {
    fontSize: 13,
    color: colors.neutral[500],
    marginLeft: 6,
    fontWeight: '500',
  },
  compactCountActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { REACTIONS, ReactionType, ReactionCounts } from '../types';
import { colors, borderRadius, shadows } from '../theme/theme';
import { abbreviateNumber } from '../utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOOLTIP_HEIGHT = 48;
const TOOLTIP_ARROW = 8;
const EMOJI_SIZE = 28;
const EMOJI_HIT = 40;
const TOOLTIP_PADDING_H = 8;
const TOOLTIP_WIDTH =
  TOOLTIP_PADDING_H * 2 + REACTIONS.length * EMOJI_HIT;

interface ReactionPickerProps {
  reactions?: ReactionCounts;
  userReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
}

function getTopReactions(
  reactions: ReactionCounts | undefined
): string[] {
  if (!reactions) return [];
  return REACTIONS.map((r) => ({
    emoji: r.emoji,
    count: reactions[r.type] ?? 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((r) => r.emoji);
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  reactions,
  userReaction,
  onReact,
}) => {
  const [visible, setVisible] = useState(false);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0, w: 0 });
  const triggerRef = useRef<View>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const total = reactions?.total ?? 0;
  const topEmojis = getTopReactions(reactions);
  const activeConfig = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)
    : null;

  const openPicker = () => {
    triggerRef.current?.measureInWindow((x, y, w, _h) => {
      setAnchorPos({ x, y, w });
      setVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 160,
      }).start();
    });
  };

  const closePicker = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleReact = (type: ReactionType) => {
    closePicker();
    onReact(type);
  };

  const tooltipLeft = Math.max(
    8,
    Math.min(
      anchorPos.x + anchorPos.w / 2 - TOOLTIP_WIDTH / 2,
      SCREEN_WIDTH - TOOLTIP_WIDTH - 8
    )
  );
  const tooltipTop = anchorPos.y - TOOLTIP_HEIGHT - TOOLTIP_ARROW - 4;
  const arrowLeft = anchorPos.x + anchorPos.w / 2 - tooltipLeft - TOOLTIP_ARROW;

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        style={styles.trigger}
        onPress={openPicker}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {activeConfig ? (
          <Text style={styles.triggerEmoji}>{activeConfig.emoji}</Text>
        ) : topEmojis.length > 0 ? (
          <View style={styles.emojiStack}>
            {topEmojis.map((emoji, i) => (
              <Text key={i} style={styles.stackEmoji}>{emoji}</Text>
            ))}
          </View>
        ) : (
          <Text style={styles.triggerEmoji}>{REACTIONS[0].emoji}</Text>
        )}
        <Text style={[styles.count, activeConfig && styles.countActive]}>
          {abbreviateNumber(total)}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closePicker}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Animated.View
            style={[
              styles.tooltip,
              {
                top: tooltipTop,
                left: tooltipLeft,
                transform: [{ scale: scaleAnim }],
                opacity: scaleAnim,
              },
            ]}
          >
            {REACTIONS.map((r) => {
              const isActive = userReaction === r.type;
              return (
                <TouchableOpacity
                  key={r.type}
                  style={[styles.emojiBtn, isActive && styles.emojiBtnActive]}
                  onPress={() => handleReact(r.type)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.emoji, isActive && styles.emojiActive]}>
                    {r.emoji}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View style={[styles.arrow, { left: arrowLeft }]} />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  triggerEmoji: {
    fontSize: 18,
  },
  emojiStack: {
    flexDirection: 'row',
  },
  stackEmoji: {
    fontSize: 14,
    marginRight: -2,
  },
  count: {
    fontSize: 13,
    color: colors.neutral[500],
    marginLeft: 6,
    fontWeight: '500',
  },
  countActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TOOLTIP_PADDING_H,
    height: TOOLTIP_HEIGHT,
    borderRadius: TOOLTIP_HEIGHT / 2,
    backgroundColor: '#fff',
    ...shadows.lg,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  arrow: {
    position: 'absolute',
    bottom: -TOOLTIP_ARROW + 1,
    width: 0,
    height: 0,
    borderLeftWidth: TOOLTIP_ARROW,
    borderRightWidth: TOOLTIP_ARROW,
    borderTopWidth: TOOLTIP_ARROW,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
  },
  emojiBtn: {
    width: EMOJI_HIT,
    height: EMOJI_HIT,
    borderRadius: EMOJI_HIT / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnActive: {
    backgroundColor: colors.primary[100],
  },
  emoji: {
    fontSize: EMOJI_SIZE,
  },
  emojiActive: {
    fontSize: EMOJI_SIZE + 4,
  },
});

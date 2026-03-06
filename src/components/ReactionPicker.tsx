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
import { colors } from '../theme/theme';
import { abbreviateNumber } from '../utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOOLTIP_HEIGHT = 32;
const TOOLTIP_ARROW = 5;
const EMOJI_SIZE = 16;
const EMOJI_HIT = 28;
const TOOLTIP_PADDING_H = 4;
const TOOLTIP_WIDTH = TOOLTIP_PADDING_H * 2 + REACTIONS.length * EMOJI_HIT;
const GAP = 2;

const CHIP_SIZE = 20;
const CHIP_OVERLAP = -6;

interface ReactionPickerProps {
  reactions?: ReactionCounts;
  userReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
}

function getActiveReactionEmojis(reactions: ReactionCounts | undefined): string[] {
  if (!reactions) return [];
  return REACTIONS
    .filter((r) => (reactions[r.type] ?? 0) > 0)
    .sort((a, b) => (reactions[b.type] ?? 0) - (reactions[a.type] ?? 0))
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
  const glowAnim = useRef(new Animated.Value(0)).current;

  const total = reactions?.total ?? 0;
  const activeEmojis = getActiveReactionEmojis(reactions);
  const activeConfig = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)
    : null;

  const openPicker = () => {
    triggerRef.current?.measureInWindow((x, y, w, _h) => {
      setAnchorPos({ x, y, w });
      setVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          friction: 7,
          tension: 180,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const closePicker = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start(() => setVisible(false));
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
  const tooltipTop = anchorPos.y - TOOLTIP_HEIGHT - TOOLTIP_ARROW - GAP;
  const arrowLeft = anchorPos.x + anchorPos.w / 2 - tooltipLeft - TOOLTIP_ARROW;

  const triggerGlow = {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.45],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
  };

  const showChips = activeEmojis.length > 0;

  return (
    <>
      <Animated.View style={[styles.triggerWrap, visible && triggerGlow]}>
        <TouchableOpacity
          ref={triggerRef}
          style={[styles.trigger, visible && styles.triggerOpen]}
          onPress={openPicker}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {showChips ? (
            <View style={styles.chipRow}>
              {activeEmojis.map((emoji, i) => (
                <View
                  key={i}
                  style={[
                    styles.chip,
                    i > 0 && { marginLeft: CHIP_OVERLAP },
                    { zIndex: activeEmojis.length - i },
                  ]}
                >
                  <Text style={styles.chipEmoji}>{emoji}</Text>
                </View>
              ))}
            </View>
          ) : activeConfig ? (
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipEmoji}>{activeConfig.emoji}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.chipRow}>
              <View style={[styles.chip, styles.chipEmpty]}>
                <Text style={styles.chipEmoji}>{REACTIONS[0].emoji}</Text>
              </View>
            </View>
          )}
          <Text style={[styles.count, (activeConfig || total > 0) && styles.countActive]}>
            {abbreviateNumber(total)}
          </Text>
        </TouchableOpacity>
      </Animated.View>

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
  triggerWrap: {
    borderRadius: 12,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
  },
  triggerOpen: {
    backgroundColor: colors.primary[50],
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  chipEmpty: {
    borderColor: colors.neutral[200],
  },
  chipEmoji: {
    fontSize: 11,
  },
  count: {
    fontSize: 13,
    color: colors.neutral[500],
    marginLeft: 5,
    fontWeight: '500',
  },
  countActive: {
    color: colors.neutral[700],
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
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
    fontSize: EMOJI_SIZE + 2,
  },
});

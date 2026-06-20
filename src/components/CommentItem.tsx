import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type TextStyle,
} from 'react-native';
import { MessageCircle, Trash2 } from 'lucide-react-native';
import { Comment, Mention } from '../types';
import { fetchReplies } from '../services/api';
import { formatTimeAgo } from '../utils/format';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../state/useAuthStore';
import { MENTION_AVATAR_COLORS } from '@/src/theme/chartPalette';
import type { AppPalette, ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

type CommentStyles = ReturnType<typeof buildCommentItemStyles>;

function RichCommentBody({
  body,
  mentions,
  styles,
}: {
  body: string;
  mentions: Mention[];
  styles: CommentStyles;
}) {
  if (!mentions || mentions.length === 0) {
    return <Text style={styles.text}>{body}</Text>;
  }

  const sorted = [...mentions].sort((a, b) => a.offset - b.offset);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((m, i) => {
    if (m.offset > cursor) {
      parts.push(
        <Text key={`t${i}`} style={styles.text}>
          {body.slice(cursor, m.offset)}
        </Text>
      );
    }
    parts.push(
      <Text key={`m${i}`} style={styles.mentionText}>
        {body.slice(m.offset, m.offset + m.length)}
      </Text>
    );
    cursor = m.offset + m.length;
  });

  if (cursor < body.length) {
    parts.push(
      <Text key="tail" style={styles.text}>
        {body.slice(cursor)}
      </Text>
    );
  }

  return <Text style={styles.text}>{parts}</Text>;
}

interface CommentItemProps {
  comment: Comment;
  newsId: string;
  onReply: (commentId: string, username: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

const MAX_DEPTH = 1;

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

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  newsId,
  onReply,
  onDelete,
  depth = 0,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCommentItemStyles(tokens), [tokens]);
  const c = tokens.colors;

  const [replies, setReplies] = useState<Comment[]>([]);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwn = currentUserId === comment.userId;

  const loadReplies = async (page: number = 1) => {
    setLoadingReplies(true);
    try {
      const fetched = await fetchReplies(newsId, comment.id, page, 10);
      if (page === 1) {
        setReplies(fetched);
      } else {
        setReplies((prev) => [...prev, ...fetched]);
      }
      setHasMoreReplies(fetched.length === 10);
      setReplyPage(page);
    } catch {
      // silently fail
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = async () => {
    if (repliesExpanded) {
      setRepliesExpanded(false);
      return;
    }
    setRepliesExpanded(true);
    if (replies.length === 0) {
      await loadReplies(1);
    }
  };

  const loadMoreReplies = () => {
    if (!loadingReplies && hasMoreReplies) {
      loadReplies(replyPage + 1);
    }
  };

  const isDeleted = comment.body === '[deleted]';

  return (
    <View style={[styles.wrapper, depth > 0 && styles.nested]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(comment.username, c) }]}>
          <Text style={styles.avatarText}>
            {comment.username[0]?.toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={styles.username}>{comment.username}</Text>
            <Text style={styles.time}>
              {formatTimeAgo(new Date(comment.createdAt))}
            </Text>
          </View>

          {isDeleted ? (
            <Text style={[styles.text, styles.deletedText]}>
              {comment.body}
            </Text>
          ) : (
            <RichCommentBody body={comment.body} mentions={comment.mentions} styles={styles} />
          )}

          {!isDeleted && (
            <View style={styles.actions}>
              {depth < MAX_DEPTH && (
                <TouchableOpacity
                  onPress={() => onReply(comment.id, comment.username)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.actionLink}>{t('comments.reply')}</Text>
                </TouchableOpacity>
              )}
              {isOwn && (
                <TouchableOpacity
                  onPress={() => onDelete(comment.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={14} color={c.danger[500]} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {comment.replyCount > 0 && depth < MAX_DEPTH && (
        <TouchableOpacity onPress={toggleReplies} style={styles.expandBtn}>
          <MessageCircle size={14} color={c.primary[500]} />
          <Text style={styles.expandText}>
            {repliesExpanded
              ? t('comments.hideReplies')
              : t('comments.viewReplies', { count: comment.replyCount })}
          </Text>
        </TouchableOpacity>
      )}

      {repliesExpanded && (
        <View>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              newsId={newsId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
          {loadingReplies && (
            <ActivityIndicator
              size="small"
              color={c.primary[500]}
              style={styles.loader}
            />
          )}
          {hasMoreReplies && replies.length > 0 && !loadingReplies && (
            <TouchableOpacity onPress={loadMoreReplies} style={styles.expandBtn}>
              <Text style={styles.expandText}>{t('comments.loadMoreReplies')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

function buildCommentItemStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  return StyleSheet.create({
    wrapper: {
      paddingVertical: s.sm,
    },
    nested: {
      marginLeft: 36,
      borderLeftWidth: 2,
      borderLeftColor: tokens.borderSubtle,
      paddingLeft: s.sm,
    },
    row: {
      flexDirection: 'row',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: s.sm,
      marginTop: 2,
    },
    avatarText: {
      fontSize: 14,
      fontWeight: '700',
      color: c.white,
    },
    body: {
      flex: 1,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    username: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.text,
      marginRight: s.sm,
    },
    time: {
      fontSize: 11,
      color: tokens.textMuted,
    },
    text: {
      fontSize: 14,
      color: tokens.textMuted,
      lineHeight: 20,
    } as TextStyle,
    mentionText: {
      color: c.primary[500],
      fontWeight: '600',
    } as TextStyle,
    deletedText: {
      fontStyle: 'italic',
      color: tokens.textMuted,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginTop: 4,
    },
    actionLink: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary[500],
    },
    expandBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 40,
      marginTop: 4,
    },
    expandText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary[500],
    },
    loader: {
      marginVertical: s.sm,
    },
  });
}

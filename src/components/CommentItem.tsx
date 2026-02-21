import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, Trash2 } from 'lucide-react-native';
import { Comment, Mention } from '../types';
import { fetchReplies } from '../services/api';
import { formatTimeAgo } from '../utils/format';
import { useAuthStore } from '../state/useAuthStore';
import { colors, spacing } from '../theme/theme';

function RichCommentBody({ body, mentions }: { body: string; mentions: Mention[] }) {
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

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  newsId,
  onReply,
  onDelete,
  depth = 0,
}) => {
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
        <View style={[styles.avatar, { backgroundColor: avatarColor(comment.username) }]}>
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
            <RichCommentBody body={comment.body} mentions={comment.mentions} />
          )}

          {!isDeleted && (
            <View style={styles.actions}>
              {depth < MAX_DEPTH && (
                <TouchableOpacity
                  onPress={() => onReply(comment.id, comment.username)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.actionLink}>Reply</Text>
                </TouchableOpacity>
              )}
              {isOwn && (
                <TouchableOpacity
                  onPress={() => onDelete(comment.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={14} color={colors.danger[500]} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {comment.replyCount > 0 && depth < MAX_DEPTH && (
        <TouchableOpacity onPress={toggleReplies} style={styles.expandBtn}>
          <MessageCircle size={14} color={colors.primary[500]} />
          <Text style={styles.expandText}>
            {repliesExpanded ? 'Hide replies' : `View ${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
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
              color={colors.primary[500]}
              style={styles.loader}
            />
          )}
          {hasMoreReplies && replies.length > 0 && !loadingReplies && (
            <TouchableOpacity onPress={loadMoreReplies} style={styles.expandBtn}>
              <Text style={styles.expandText}>Load more replies</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.sm,
  },
  nested: {
    marginLeft: 36,
    borderLeftWidth: 2,
    borderLeftColor: colors.neutral[200],
    paddingLeft: spacing.sm,
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
    marginRight: spacing.sm,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
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
    color: colors.neutral[800],
    marginRight: spacing.sm,
  },
  time: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  text: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  mentionText: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  deletedText: {
    fontStyle: 'italic',
    color: colors.neutral[400],
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
    color: colors.primary[500],
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
    color: colors.primary[500],
  },
  loader: {
    marginVertical: spacing.sm,
  },
});

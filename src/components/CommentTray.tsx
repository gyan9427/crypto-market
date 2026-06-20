import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Send, ArrowUpRight } from 'lucide-react-native';
import { Comment } from '../types';
import { fetchComments, postComment, deleteComment } from '../services/api';
import { CommentItem } from './CommentItem';
import { MentionAutocomplete } from './MentionAutocomplete';
import { useAuthStore } from '../state/useAuthStore';
import type { ThemeTokens } from '../theme/theme';
import { useAppTheme } from '@/src/theme/ThemeProvider';

interface CommentTrayProps {
  visible: boolean;
  newsId: string | null;
  commentCount: number;
  onClose: () => void;
  onCountChange: (newsId: string, count: number) => void;
}

function extractMentionQuery(text: string): string | null {
  const match = text.match(/@(\w*)$/);
  return match ? match[1] : null;
}

export const CommentTray: React.FC<CommentTrayProps> = ({
  visible,
  newsId,
  commentCount,
  onClose,
  onCountChange,
}) => {
  const { t } = useTranslation();
  const { tokens } = useAppTheme();
  const styles = useMemo(() => buildCommentTrayStyles(tokens), [tokens]);
  const c = tokens.colors;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [localCount, setLocalCount] = useState(commentCount);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const localCandidates = useMemo(() => {
    const seen = new Set<string>();
    const candidates: { id: string; username: string }[] = [];
    for (const cm of comments) {
      if (!seen.has(cm.userId)) {
        seen.add(cm.userId);
        candidates.push({ id: cm.userId, username: cm.username });
      }
    }
    return candidates;
  }, [comments]);

  useEffect(() => {
    setLocalCount(commentCount);
  }, [commentCount]);

  useEffect(() => {
    if (visible && newsId) {
      loadComments(1);
    }
    if (!visible) {
      setComments([]);
      setPage(1);
      setHasMore(true);
      setReplyingTo(null);
      setInputText('');
      setMentionQuery(null);
    }
  }, [visible, newsId]);

  const loadComments = async (p: number) => {
    if (!newsId) return;
    setLoading(true);
    try {
      const fetched = await fetchComments(newsId, p, 20);
      if (p === 1) {
        setComments(fetched);
      } else {
        setComments((prev) => [...prev, ...fetched]);
      }
      setHasMore(fetched.length === 20);
      setPage(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadComments(page + 1);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    setMentionQuery(extractMentionQuery(text));
  };

  const handleMentionSelect = (user: { id: string; username: string }) => {
    const atIdx = inputText.lastIndexOf('@');
    if (atIdx === -1) return;
    const before = inputText.slice(0, atIdx);
    const newText = `${before}@${user.username} `;
    setInputText(newText);
    setMentionQuery(null);
  };

  const handleSend = async () => {
    if (!newsId || !inputText.trim() || sending) return;
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please log in to comment.');
      return;
    }

    setSending(true);
    try {
      const result = await postComment(
        newsId,
        inputText.trim(),
        replyingTo?.commentId
      );

      if (replyingTo) {
        setComments((prev) =>
          prev.map((cm) =>
            cm.id === replyingTo.commentId
              ? { ...cm, replyCount: cm.replyCount + 1 }
              : cm
          )
        );
      } else {
        setComments((prev) => [result.comment, ...prev]);
      }

      setLocalCount(result.commentCount);
      onCountChange(newsId, result.commentCount);
      setInputText('');
      setReplyingTo(null);
      setMentionQuery(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!newsId) return;
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await deleteComment(newsId, commentId);
            setComments((prev) =>
              prev.filter((cm) => cm.id !== commentId)
            );
            setLocalCount(result.commentCount);
            onCountChange(newsId, result.commentCount);
          } catch {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  const handleReply = useCallback(
    (commentId: string, username: string) => {
      setReplyingTo({ commentId, username });
      inputRef.current?.focus();
    },
    []
  );

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        newsId={newsId!}
        onReply={handleReply}
        onDelete={handleDelete}
      />
    ),
    [newsId, handleReply, handleDelete]
  );

  const keyExtractor = useCallback((item: Comment) => item.id, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.tray}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>{t('comments.headerWithCount', { count: localCount })}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={22} color={c.neutral[600]} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('comments.empty')}</Text>
                </View>
              ) : null
            }
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

          {replyingTo && (
            <View style={styles.replyBar}>
              <ArrowUpRight size={14} color={c.primary[500]} />
              <Text style={styles.replyBarText} numberOfLines={1}>
                {t('comments.replyingTo', { username: replyingTo.username })}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <X size={16} color={c.neutral[500]} />
              </TouchableOpacity>
            </View>
          )}

          {mentionQuery !== null && (
            <MentionAutocomplete
              query={mentionQuery}
              localCandidates={localCandidates}
              onSelect={handleMentionSelect}
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={
                replyingTo
                  ? t('comments.placeholderReply', { username: replyingTo.username })
                  : t('comments.placeholderWrite')
              }
              placeholderTextColor={c.neutral[400]}
              value={inputText}
              onChangeText={handleTextChange}
              maxLength={500}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={tokens.colors.white} />
              ) : (
                <Send size={18} color={tokens.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function buildCommentTrayStyles(tokens: ThemeTokens) {
  const c = tokens.colors;
  const s = tokens.spacing;
  const br = tokens.borderRadius;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
      backgroundColor: tokens.semantic.backdrop,
    },
    tray: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '75%',
      minHeight: 300,
      ...tokens.shadows.lg,
    },
    header: {
      alignItems: 'center',
      paddingTop: s.sm,
      paddingBottom: s.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.neutral[100],
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.neutral[300],
      marginBottom: s.sm,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: s.md,
      paddingBottom: s.sm,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.neutral[800],
    },
    listContent: {
      paddingHorizontal: s.md,
      paddingBottom: s.sm,
    },
    emptyContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.neutral[400],
    },
    loader: {
      marginVertical: s.md,
    },
    replyBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: s.md,
      paddingVertical: 6,
      backgroundColor: c.primary[50],
      borderTopWidth: 1,
      borderTopColor: c.primary[100],
    },
    replyBarText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: c.primary[700],
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: s.md,
      paddingVertical: s.sm,
      borderTopWidth: 1,
      borderTopColor: c.neutral[100],
      backgroundColor: tokens.surface,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: c.neutral[800],
      backgroundColor: c.neutral[100],
      borderRadius: br.lg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxHeight: 100,
      marginRight: s.sm,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: c.neutral[300],
    },
  });
}

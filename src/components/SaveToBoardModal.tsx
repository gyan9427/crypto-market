import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Check, Plus, BookmarkCheck } from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '../theme/theme';
import { NewsBoard } from '../types';
import { useAppStore } from '../state/useAppStore';
import { getNewsBoards, createNewsBoard, saveNewsToBoard } from '../services/api';
import { useAuthStore } from '../state/useAuthStore';

interface SaveToBoardModalProps {
  visible: boolean;
  newsId: string | null;
  onClose: () => void;
  onSaved: (newsId: string, saveCount: number) => void;
}

export const SaveToBoardModal: React.FC<SaveToBoardModalProps> = ({
  visible,
  newsId,
  onClose,
  onSaved,
}) => {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [boards, setLocalBoards] = useState<NewsBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeBoards = useAppStore((s) => s.boards);
  const setBoards = useAppStore((s) => s.setBoards);
  const addBoard = useAppStore((s) => s.addBoard);
  const markSaved = useAppStore((s) => s.markSaved);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Animate in/out when visible changes
  useEffect(() => {
    if (visible) {
      setSelectedBoardId(null);
      setIsCreating(false);
      setNewBoardName('');
      setError(null);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 3 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      fetchBoards();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchBoards = async () => {
    if (!isAuthenticated) return;
    if (storeBoards.length > 0) {
      setLocalBoards(storeBoards);
      return;
    }
    setLoading(true);
    try {
      const fetched = await getNewsBoards();
      setBoards(fetched);
      setLocalBoards(fetched);
    } catch {
      setError('Could not load boards');
    } finally {
      setLoading(false);
    }
  };

  // Keep local boards in sync with store (after a new board is added)
  useEffect(() => {
    setLocalBoards(storeBoards);
  }, [storeBoards]);

  const handleClose = () => {
    onClose();
  };

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoardId(boardId === selectedBoardId ? null : boardId);
    setIsCreating(false);
  };

  const handleToggleCreate = () => {
    setIsCreating((v) => !v);
    setSelectedBoardId(null);
    setNewBoardName('');
  };

  const handleSave = async () => {
    if (!newsId) return;
    if (!isAuthenticated) {
      setError('Please log in to save articles');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let targetBoardId = selectedBoardId;

      if (isCreating) {
        if (!newBoardName.trim()) {
          setError('Please enter a board name');
          setSaving(false);
          return;
        }
        const newBoard = await createNewsBoard(newBoardName.trim());
        addBoard(newBoard);
        targetBoardId = newBoard.id;
      }

      if (!targetBoardId) {
        setError('Please select or create a board');
        setSaving(false);
        return;
      }

      const { saveCount } = await saveNewsToBoard(newsId, targetBoardId);

      // Update the board in store to include this newsId
      const updatedBoards = storeBoards.map((b) =>
        b.id === targetBoardId
          ? { ...b, newsIds: [...new Set([...b.newsIds, newsId])] }
          : b
      );
      setBoards(updatedBoards);
      markSaved(newsId);
      onSaved(newsId, saveCount);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const isBoardAlreadySaved = (board: NewsBoard) =>
    newsId ? board.newsIds.includes(newsId) : false;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <BookmarkCheck size={22} color={colors.primary[500]} />
            <Text style={styles.title}>Save to board</Text>
          </View>

          {/* Create new board row */}
          <TouchableOpacity
            style={[styles.createRow, isCreating && styles.createRowActive]}
            onPress={handleToggleCreate}
            activeOpacity={0.7}
          >
            <View style={styles.createIconWrap}>
              <Plus size={20} color={isCreating ? colors.primary[600] : colors.neutral[600]} />
            </View>
            <Text style={[styles.createText, isCreating && styles.createTextActive]}>
              Create new board
            </Text>
          </TouchableOpacity>

          {isCreating && (
            <TextInput
              style={styles.nameInput}
              placeholder="Board name (e.g. DeFi Reads)"
              placeholderTextColor={colors.neutral[400]}
              value={newBoardName}
              onChangeText={setNewBoardName}
              maxLength={100}
              autoFocus
            />
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Board list */}
          {loading ? (
            <ActivityIndicator
              color={colors.primary[500]}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={boards}
              keyExtractor={(item) => item.id}
              style={styles.boardList}
              scrollEnabled={boards.length > 4}
              renderItem={({ item }) => {
                const isSelected = selectedBoardId === item.id;
                const alreadySaved = isBoardAlreadySaved(item);
                return (
                  <TouchableOpacity
                    style={[styles.boardRow, isSelected && styles.boardRowSelected]}
                    onPress={() => handleSelectBoard(item.id)}
                    activeOpacity={0.7}
                    disabled={alreadySaved}
                  >
                    <View style={styles.boardInfo}>
                      <Text style={[styles.boardName, alreadySaved && styles.boardNameMuted]}>
                        {item.name}
                      </Text>
                      <Text style={styles.boardCount}>
                        {item.newsIds.length} {item.newsIds.length === 1 ? 'article' : 'articles'}
                      </Text>
                    </View>
                    {alreadySaved ? (
                      <Check size={18} color={colors.success[500]} />
                    ) : isSelected ? (
                      <View style={styles.radioSelected} />
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                !loading ? (
                  <Text style={styles.emptyBoards}>
                    No boards yet — create your first one above.
                  </Text>
                ) : null
              }
            />
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedBoardId && !isCreating) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || (!selectedBoardId && !isCreating)}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
    ...shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 12,
  },
  createRowActive: {
    backgroundColor: colors.primary[50],
  },
  createIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  createTextActive: {
    color: colors.primary[600],
  },
  nameInput: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.neutral[900],
    backgroundColor: colors.primary[50],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.xs,
  },
  boardList: {
    maxHeight: 280,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  boardRowSelected: {
    backgroundColor: colors.primary[50],
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  boardNameMuted: {
    color: colors.neutral[400],
  },
  boardCount: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  emptyBoards: {
    textAlign: 'center',
    color: colors.neutral[400],
    fontSize: 14,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: colors.error[600],
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  saveButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

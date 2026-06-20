import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { usePiStyles } from './piStyles';
import { useHasFeature } from '@/src/utils/features';
import { chatWithPortfolioAnalyst } from '@/src/services/portfolioIntelligenceApi';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { getMarketUiPalette } from '@/src/theme/chartPalette';

export const PiAiAnalystPanel: React.FC = () => {
  const styles = usePiStyles();
  const { tokens } = useAppTheme();
  const ui = useMemo(() => getMarketUiPalette(tokens), [tokens]);
  const localStyles = useMemo(() => buildLocalStyles(tokens, ui), [tokens, ui]);
  const enabled = useHasFeature('portfolio_intelligence_ai_analyst');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await chatWithPortfolioAnalyst(trimmed, sessionId);
      if (!result) {
        setError('Unable to reach portfolio analyst.');
        return;
      }
      if (result.blocked) {
        setError(result.reason ?? 'Request blocked by governance policy.');
        return;
      }
      setSessionId(result.sessionId);
      setResponse(result.response ?? null);
      setMessage('');
    } finally {
      setLoading(false);
    }
  }, [message, loading, sessionId]);

  if (!enabled) return null;

  return (
    <View style={[styles.sectionWrap, styles.card]}>
      <Text style={styles.cardTitle}>Portfolio Analyst</Text>
      <Text style={styles.cardSubtitle}>
        Ask about allocation, risk, and insights. Not financial advice.
      </Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="What drives my portfolio risk?"
        placeholderTextColor={tokens.textMuted}
        style={localStyles.input}
        editable={!loading}
        multiline
      />
      <TouchableOpacity
        onPress={() => void handleSend()}
        style={[localStyles.sendBtn, loading && localStyles.sendBtnDisabled]}
        disabled={loading || !message.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send question to portfolio analyst"
      >
        {loading ? (
          <ActivityIndicator size="small" color={tokens.colors.white} />
        ) : (
          <Text style={localStyles.sendBtnText}>Ask</Text>
        )}
      </TouchableOpacity>
      {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
      {response ? <Text style={styles.insightSummary}>{response}</Text> : null}
    </View>
  );
};

function buildLocalStyles(
  tokens: ReturnType<typeof useAppTheme>['tokens'],
  ui: ReturnType<typeof getMarketUiPalette>
) {
  return StyleSheet.create({
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.borderStrong,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 44,
      color: tokens.text,
      marginBottom: 10,
    },
    sendBtn: {
      alignSelf: 'flex-start',
      backgroundColor: ui.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 72,
      alignItems: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.6,
    },
    sendBtnText: {
      color: tokens.colors.white,
      fontWeight: '600',
    },
    errorText: {
      marginTop: 8,
      color: tokens.colors.error[500],
      fontSize: 13,
    },
  });
}

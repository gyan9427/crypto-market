import React, { useCallback, useState } from 'react';
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

export const PiAiAnalystPanel: React.FC = () => {
  const styles = usePiStyles();
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
        placeholderTextColor="#888"
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
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={localStyles.sendBtnText}>Ask</Text>
        )}
      </TouchableOpacity>
      {error ? <Text style={localStyles.errorText}>{error}</Text> : null}
      {response ? <Text style={styles.insightSummary}>{response}</Text> : null}
    </View>
  );
};

const localStyles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    color: '#fff',
    marginBottom: 10,
  },
  sendBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#6383ff',
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
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 13,
  },
});

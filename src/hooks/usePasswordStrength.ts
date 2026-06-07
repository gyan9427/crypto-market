import { useEffect, useMemo, useRef, useState } from 'react';
import {
  evaluatePassword,
  STRENGTH_COLORS,
  type PasswordEvaluationResult,
  type StrengthLevel,
} from '@nayft/password-policy';
import { loadZxcvbn } from '@/src/utils/loadZxcvbn';

export type PasswordStrengthContext = {
  email?: string;
  username?: string;
};

const EMPTY_RESULT: PasswordEvaluationResult = {
  valid: false,
  level: 'poor',
  score: 0,
  fillRatio: 0,
  violations: [],
  feedbackKey: 'auth.passwordStrength.errorWeak',
  isAcceptable: false,
  checklist: [],
};

export function usePasswordStrength(
  password: string,
  context: PasswordStrengthContext = {},
  options: { debounceMs?: number; isDark?: boolean } = {}
): PasswordEvaluationResult & { fillColor: string; levelLabelKey: string } {
  const { debounceMs = 200, isDark = false } = options;
  const [result, setResult] = useState<PasswordEvaluationResult>(EMPTY_RESULT);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadZxcvbn().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!password) {
      setResult(EMPTY_RESULT);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (!ready) return;
      const evaluation = evaluatePassword(password, context);
      setResult(evaluation);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [password, context.email, context.username, debounceMs, ready]);

  const fillColor = useMemo(() => {
    const palette = STRENGTH_COLORS[result.level as StrengthLevel];
    return isDark ? palette.dark : palette.light;
  }, [result.level, isDark]);

  const levelLabelKey = useMemo(() => {
    return `auth.passwordStrength.level${result.level.charAt(0).toUpperCase()}${result.level.slice(1)}`;
  }, [result.level]);

  return { ...result, fillColor, levelLabelKey };
}

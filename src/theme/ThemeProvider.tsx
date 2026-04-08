import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { useAppStore } from '@/src/state/useAppStore';
import type { ThemePreference } from '@/src/types';
import {
  getThemeTokens,
  typography,
  typographyWithFonts,
  type ThemeTokens,
} from './theme';

type ThemeContextValue = {
  tokens: ThemeTokens;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  effectiveScheme: 'light' | 'dark';
  fontsLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const effectiveScheme: 'light' | 'dark' = useMemo(() => {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [preference, systemScheme]);

  const isDark = effectiveScheme === 'dark';

  const tokens = useMemo(() => {
    const base = getThemeTokens(isDark);
    if (!fontsLoaded) return base;
    const typo = typographyWithFonts(typography, {
      manrope: {
        regular: 'Manrope_400Regular',
        medium: 'Manrope_500Medium',
        semiBold: 'Manrope_600SemiBold',
        bold: 'Manrope_700Bold',
        extraBold: 'Manrope_800ExtraBold',
      },
      jetbrains: {
        regular: 'JetBrainsMono_400Regular',
        medium: 'JetBrainsMono_500Medium',
      },
    });
    return { ...base, typography: typo };
  }, [isDark, fontsLoaded]);

  const setPreference = useCallback(
    (p: ThemePreference) => {
      setThemePreference(p);
    },
    [setThemePreference]
  );

  const value = useMemo(
    () =>
      ({
        tokens,
        preference,
        setPreference,
        effectiveScheme,
        fontsLoaded,
      }) satisfies ThemeContextValue,
    [tokens, preference, setPreference, effectiveScheme, fontsLoaded]
  );

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(tokens.bg);
  }, [tokens.bg]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}

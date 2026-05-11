import React, { createContext, useContext } from 'react';
import type { ChartUIPalette } from '@/src/theme/chartPalette';

const ChartUiContext = createContext<ChartUIPalette | null>(null);

export function ChartUiProvider({
  value,
  children,
}: {
  value: ChartUIPalette;
  children: React.ReactNode;
}) {
  return <ChartUiContext.Provider value={value}>{children}</ChartUiContext.Provider>;
}

export function useChartUi(): ChartUIPalette {
  const ctx = useContext(ChartUiContext);
  if (!ctx) {
    throw new Error('useChartUi must be used within ChartUiProvider');
  }
  return ctx;
}

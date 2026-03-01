import { useColorScheme } from 'react-native';

export type ChartTheme = 'light' | 'dark';

export function useChartTheme(): ChartTheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { GridReadyEvent } from 'ag-grid-community';
import { TrendingCoin } from '../types';
import { formatMarketCap } from '../utils/format';
import { colors } from '../theme/theme';
import { LivePriceCell } from './LivePriceCell';
import { LiveChangeCell } from './LiveChangeCell';

// Only import CSS on web platform
if (Platform.OS === 'web') {
  try {
    require('ag-grid-community/styles/ag-grid.css');
    require('ag-grid-community/styles/ag-theme-alpine.css');
  } catch (e) {
    console.warn('Could not load AG Grid styles:', e);
  }
}

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface CoinTableViewProps {
  coins: TrendingCoin[];
  onCoinPress?: (coinId: string) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  hasMore?: boolean;
  loadingMore?: boolean;
}

const ROW_HEIGHT = 60;

export const CoinTableView: React.FC<CoinTableViewProps> = ({
  coins,
  onCoinPress,
  onEndReached,
  onEndReachedThreshold = 0.5,
  hasMore = false,
  loadingMore = false,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastLoadRef = useRef(false);
  const viewportRef = useRef<HTMLElement | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const onEndReachedRef = useRef(onEndReached);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const thresholdRef = useRef(onEndReachedThreshold);
  onEndReachedRef.current = onEndReached;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;
  thresholdRef.current = onEndReachedThreshold;
  // Only render on web platform
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Table view is only available on web. Please use list view on mobile.
        </Text>
      </View>
    );
  }

  const columnDefs = useMemo(
    () => [
      {
        field: 'rank',
        headerName: '#',
        width: 60,
        cellStyle: { textAlign: 'center' },
        sortable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        field: 'symbol',
        headerName: 'Ticker',
        width: 120,
        cellRenderer: (params: any) => {
          const coin = params.data as TrendingCoin;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: colors.primary[500],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {coin.symbol[0]}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{coin.symbol}</div>
                <div style={{ fontSize: '12px', color: colors.neutral[500] }}>{coin.name}</div>
              </div>
            </div>
          );
        },
        sortable: true,
        filter: 'agTextColumnFilter',
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 130,
        cellRenderer: (params: any) => {
          const coin = params.data as TrendingCoin;
          return <LivePriceCell symbol={coin.symbol} basePrice={params.value ?? 0} />;
        },
        sortable: true,
        filter: 'agNumberColumnFilter',
        comparator: (valueA: number, valueB: number) => valueA - valueB,
      },
      {
        field: 'change24h',
        headerName: '24h Change',
        width: 130,
        cellRenderer: (params: any) => {
          const coin = params.data as TrendingCoin;
          return <LiveChangeCell symbol={coin.symbol} baseChange24h={params.value ?? 0} />;
        },
        sortable: true,
        filter: 'agNumberColumnFilter',
        comparator: (valueA: number, valueB: number) => valueA - valueB,
      },
      {
        field: 'marketCap',
        headerName: 'Market Cap',
        width: 150,
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          return <span>{formatMarketCap(params.value)}</span>;
        },
        sortable: true,
        filter: 'agNumberColumnFilter',
        comparator: (valueA: number, valueB: number) => (valueA || 0) - (valueB || 0),
      },
      {
        field: 'volume24h',
        headerName: '24h Volume',
        width: 150,
        cellRenderer: (params: any) => {
          if (!params.value) return '-';
          return <span>{formatMarketCap(params.value)}</span>;
        },
        sortable: true,
        filter: 'agNumberColumnFilter',
        comparator: (valueA: number, valueB: number) => (valueA || 0) - (valueB || 0),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const rowData = useMemo(() => coins, [coins]);

  const onRowClicked = (event: any) => {
    if (onCoinPress && event.data) {
      onCoinPress(event.data.id);
    }
  };

  const onGridReady = useCallback(
    (_event: GridReadyEvent) => {
      if (!onEndReached || Platform.OS !== 'web') return;
      const container = containerRef.current;
      if (!container) return;
      const viewport = container.querySelector('.ag-body-viewport') as HTMLElement | null;
      if (!viewport) return;
      viewportRef.current = viewport;
      const checkScroll = () => {
        if (!hasMoreRef.current || loadingMoreRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const threshold = clientHeight * thresholdRef.current;
        if (scrollTop + clientHeight >= scrollHeight - threshold) {
          if (lastLoadRef.current) return;
          lastLoadRef.current = true;
          onEndReachedRef.current?.();
          setTimeout(() => {
            lastLoadRef.current = false;
          }, 500);
        }
      };
      scrollHandlerRef.current = checkScroll;
      viewport.addEventListener('scroll', checkScroll, { passive: true });
    },
    [onEndReached]
  );

  useEffect(() => {
    return () => {
      const viewport = viewportRef.current;
      const handler = scrollHandlerRef.current;
      if (viewport && handler) {
        viewport.removeEventListener('scroll', handler);
        viewportRef.current = null;
        scrollHandlerRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <div
          ref={containerRef}
          className="ag-theme-alpine"
          style={{
            height: 500,
            width: '100%',
            minHeight: 400,
          } as React.CSSProperties}
        >
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onRowClicked={onRowClicked}
            onGridReady={onGridReady}
            rowHeight={ROW_HEIGHT}
            headerHeight={50}
            suppressCellFocus={true}
            animateRows={true}
            pagination={false}
          />
          {loadingMore && (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          )}
        </div>
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            Table view is only available on web. Please use list view on mobile.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  gridWrapper: {
    height: 500,
    width: '100%',
    minHeight: 400,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fallbackText: {
    color: colors.neutral[600],
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

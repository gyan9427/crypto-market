import React, { useMemo } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { TrendingCoin } from '../types';
import { formatPrice, formatPercentage, formatMarketCap } from '../utils/format';
import { colors } from '../theme/theme';

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
}

export const CoinTableView: React.FC<CoinTableViewProps> = ({ coins, onCoinPress }) => {
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
          return <span style={{ fontWeight: '600' }}>{formatPrice(params.value)}</span>;
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
          const value = params.value as number;
          const isPositive = value >= 0;
          return (
            <span
              style={{
                color: isPositive ? colors.success[500] : colors.danger[500],
                fontWeight: '600',
              }}
            >
              {formatPercentage(value)}
            </span>
          );
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

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View
          // @ts-ignore - className is valid for web
          className="ag-theme-alpine"
          style={styles.gridWrapper}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onRowClicked={onRowClicked}
            rowHeight={60}
            headerHeight={50}
            suppressCellFocus={true}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
          />
        </View>
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
});

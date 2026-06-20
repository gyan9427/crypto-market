import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getMarketUiPalette } from '@/src/theme/chartPalette';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { ThemeTokens } from '@/src/theme/theme';

interface OrderRow {
  price: number;
  size: number;
  total: number;
}

function generateRows(base: number, side: 'ask' | 'bid', count: number): OrderRow[] {
  const rows: OrderRow[] = [];
  for (let i = 0; i < count; i++) {
    const spread = (i + 1) * 12.4 + Math.random() * 5;
    const price = side === 'ask' ? base + spread : base - spread;
    rows.push({
      price,
      size: parseFloat((0.2 + Math.random() * 2.8).toFixed(3)),
      total: parseFloat((1.2 + Math.random() * 8).toFixed(2)),
    });
  }
  return side === 'ask' ? rows.reverse() : rows;
}

interface Props {
  basePrice: number;
}

type OrderBookTheme = ReturnType<typeof buildOrderBookTheme>;

export function OrderBook({ basePrice }: Props) {
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);
  const { tokens } = useAppTheme();
  const theme = useMemo(() => buildOrderBookTheme(tokens), [tokens]);

  useEffect(() => {
    const refresh = () => {
      if (basePrice <= 0) return;
      setAsks(generateRows(basePrice, 'ask', 6));
      setBids(generateRows(basePrice, 'bid', 6));
    };
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [basePrice]);

  const spread = useMemo(() => {
    if (!asks.length || !bids.length) return { abs: 0, pct: '0.000' };
    const nearestAsk = asks[asks.length - 1].price;
    const nearestBid = bids[0].price;
    const abs = nearestAsk - nearestBid;
    const pct = basePrice > 0 ? ((abs / basePrice) * 100).toFixed(3) : '0.000';
    return { abs, pct };
  }, [asks, bids, basePrice]);

  const maxTotal = useMemo(
    () => Math.max(...asks.map((r) => r.total), ...bids.map((r) => r.total), 1),
    [asks, bids]
  );

  const fmtPx = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <View>
      <View style={theme.styles.header}>
        <Text style={theme.styles.title}>Order Book</Text>
        <Text style={theme.styles.spread}>
          Spread: ${spread.abs.toFixed(2)} ({spread.pct}%)
        </Text>
      </View>

      <View style={theme.styles.colRow}>
        <Text style={theme.styles.col}>Price (USDT)</Text>
        <Text style={[theme.styles.col, theme.styles.right]}>Size</Text>
        <Text style={[theme.styles.col, theme.styles.right]}>Total</Text>
      </View>

      {asks.map((row, i) => (
        <OBRow key={`a${i}`} row={row} side="ask" maxTotal={maxTotal} fmtPx={fmtPx} theme={theme} />
      ))}

      <View style={theme.styles.midRow}>
        <Text style={theme.styles.midPrice}>
          $
          {basePrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text style={theme.styles.midLabel}>Mid price</Text>
      </View>

      {bids.map((row, i) => (
        <OBRow key={`b${i}`} row={row} side="bid" maxTotal={maxTotal} fmtPx={fmtPx} theme={theme} />
      ))}
    </View>
  );
}

function OBRow({
  row,
  side,
  maxTotal,
  fmtPx,
  theme,
}: {
  row: OrderRow;
  side: 'ask' | 'bid';
  maxTotal: number;
  fmtPx: (n: number) => string;
  theme: OrderBookTheme;
}) {
  const depthPct = `${Math.min(100, Math.round((row.total / maxTotal) * 100))}%` as const;
  const priceColor = side === 'ask' ? theme.askColor : theme.bidColor;
  const barColor = side === 'ask' ? theme.askBarBg : theme.bidBarBg;
  const barSide = side === 'ask' ? { right: 0 } : { left: 0 };

  return (
    <View style={theme.styles.row}>
      <View style={[theme.styles.bar, { width: depthPct, backgroundColor: barColor, ...barSide }]} />
      <Text style={[theme.styles.priceCell, { color: priceColor }]}>${fmtPx(row.price)}</Text>
      <Text style={theme.styles.sizeCell}>{row.size.toFixed(3)}</Text>
      <Text style={theme.styles.totalCell}>{row.total.toFixed(2)}</Text>
    </View>
  );
}

function buildOrderBookTheme(tokens: ThemeTokens) {
  const c = tokens.colors;
  const ui = getMarketUiPalette(tokens);
  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: { fontSize: 13, fontWeight: '500', color: tokens.text },
    spread: { fontSize: 11, color: tokens.textMuted },
    colRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
    col: { fontSize: 10, color: tokens.textMuted, flex: 1 },
    right: { textAlign: 'right' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 22,
      marginBottom: 2,
      position: 'relative',
    },
    bar: { position: 'absolute', top: 0, bottom: 0, borderRadius: 2 },
    priceCell: { fontSize: 11, fontWeight: '500', width: 88, zIndex: 1 },
    sizeCell: {
      flex: 1,
      fontSize: 11,
      color: tokens.textMuted,
      textAlign: 'right',
      zIndex: 1,
    },
    totalCell: {
      width: 60,
      fontSize: 11,
      color: tokens.textMuted,
      textAlign: 'right',
      zIndex: 1,
    },
    midRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginVertical: 2,
      paddingHorizontal: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.borderSubtle,
    },
    midPrice: { fontSize: 13, fontWeight: '600', color: c.success[500] },
    midLabel: { fontSize: 10, color: tokens.textMuted },
  });

  return {
    styles,
    askColor: c.error[500],
    bidColor: c.success[500],
    askBarBg: ui.orderAskBarBg,
    bidBarBg: ui.orderBidBarBg,
  };
}

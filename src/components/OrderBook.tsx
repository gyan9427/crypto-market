import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  // asks: highest price first, nearest-to-mid at bottom
  return side === 'ask' ? rows.reverse() : rows;
}

interface Props {
  basePrice: number;
}

export function OrderBook({ basePrice }: Props) {
  const [asks, setAsks] = useState<OrderRow[]>([]);
  const [bids, setBids] = useState<OrderRow[]>([]);

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
      <View style={S.header}>
        <Text style={S.title}>Order Book</Text>
        <Text style={S.spread}>
          Spread: ${spread.abs.toFixed(2)} ({spread.pct}%)
        </Text>
      </View>

      <View style={S.colRow}>
        <Text style={S.col}>Price (USDT)</Text>
        <Text style={[S.col, S.right]}>Size</Text>
        <Text style={[S.col, S.right]}>Total</Text>
      </View>

      {asks.map((row, i) => (
        <OBRow key={`a${i}`} row={row} side="ask" maxTotal={maxTotal} fmtPx={fmtPx} />
      ))}

      <View style={S.midRow}>
        <Text style={S.midPrice}>
          $
          {basePrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text style={S.midLabel}>Mid price</Text>
      </View>

      {bids.map((row, i) => (
        <OBRow key={`b${i}`} row={row} side="bid" maxTotal={maxTotal} fmtPx={fmtPx} />
      ))}
    </View>
  );
}

function OBRow({
  row,
  side,
  maxTotal,
  fmtPx,
}: {
  row: OrderRow;
  side: 'ask' | 'bid';
  maxTotal: number;
  fmtPx: (n: number) => string;
}) {
  const depthPct = `${Math.min(100, Math.round((row.total / maxTotal) * 100))}%` as const;
  const priceColor = side === 'ask' ? '#f05252' : '#27c485';
  const barColor = side === 'ask' ? 'rgba(240,82,82,0.12)' : 'rgba(39,196,133,0.12)';
  const barSide = side === 'ask' ? { right: 0 } : { left: 0 };

  return (
    <View style={S.row}>
      <View style={[S.bar, { width: depthPct, backgroundColor: barColor, ...barSide }]} />
      <Text style={[S.priceCell, { color: priceColor }]}>${fmtPx(row.price)}</Text>
      <Text style={S.sizeCell}>{row.size.toFixed(3)}</Text>
      <Text style={S.totalCell}>{row.total.toFixed(2)}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 13, fontWeight: '500', color: '#ffffff' },
  spread: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  colRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
  col: { fontSize: 10, color: 'rgba(255,255,255,0.35)', flex: 1 },
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
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
    zIndex: 1,
  },
  totalCell: {
    width: 60,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'right',
    zIndex: 1,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 5,
    marginVertical: 2,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  midPrice: { fontSize: 14, fontWeight: '500', color: '#27c485' },
  midLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
});

import React from 'react';
import { TrendingCoinCard } from './TrendingCoinCard';
import { useLivePricesStore } from '../state/useLivePricesStore';
import { TrendingCoin } from '../types';

interface LivePriceTrendingCoinCardProps {
  coin: TrendingCoin;
  onPress?: (coinId: string) => void;
}

/** Wraps TrendingCoinCard with live price from store; only re-renders when this symbol's price changes */
export const LivePriceTrendingCoinCard: React.FC<LivePriceTrendingCoinCardProps> = ({
  coin,
  onPress,
}) => {
  const live = useLivePricesStore((state) => state.prices[coin.symbol?.toUpperCase()]);
  const mergedCoin: TrendingCoin = live
    ? { ...coin, price: live.price, change24h: live.percentChange24h }
    : coin;
  return <TrendingCoinCard coin={mergedCoin} onPress={onPress} />;
};

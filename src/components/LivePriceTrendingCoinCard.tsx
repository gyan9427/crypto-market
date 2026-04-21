import React, { useMemo } from 'react';
import { TrendingCoin } from '../types';
import { TrendingCoinCard } from './TrendingCoinCard';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

interface LivePriceTrendingCoinCardProps {
  coin: TrendingCoin;
  onPress?: (coinId: string) => void;
}

export const LivePriceTrendingCoinCard: React.FC<LivePriceTrendingCoinCardProps> = ({
  coin,
  onPress,
}) => {
  const sym = coin.symbol?.trim();
  const { quotes } = useMarketPriceStream(sym ? [sym] : [], { enabled: Boolean(sym) });
  const key = sym?.toUpperCase() ?? '';
  const live = key ? quotes[key] : undefined;
  const merged = useMemo(
    () => ({
      ...coin,
      price: live?.price ?? coin.price,
      change24h: live?.percentChange24h ?? coin.change24h,
    }),
    [coin, live]
  );
  return <TrendingCoinCard coin={merged} onPress={onPress} />;
};

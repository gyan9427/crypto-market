import { resolveApiBaseUrl } from '../services/api';
import type { KlineRecord, KlinesParams } from './types';

/** CoinGecko id for common symbols (fallback when backend has no data) */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  NEAR: 'near',
  ETC: 'ethereum-classic',
  XLM: 'stellar',
  FIL: 'filecoin',
  APT: 'aptos',
  HBAR: 'hedera-hashgraph',
  SUI: 'sui',
  OP: 'optimism',
  ARB: 'arbitrum',
  INJ: 'injective-protocol',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
};

async function fetchKlinesFromCoinGecko(symbol: string, days: number = 7): Promise<KlineRecord[]> {
  const id = SYMBOL_TO_COINGECKO_ID[symbol.trim().toUpperCase()];
  if (!id) return [];

  const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const raw = await response.json();
  if (!Array.isArray(raw)) return [];

  return raw.map((row: [number, number, number, number, number]) => ({
    openTime: new Date(row[0]),
    open: row[1],
    high: row[2],
    low: row[3],
    close: row[4],
    volume: 0,
  }));
}

export async function fetchKlines(params: KlinesParams): Promise<KlineRecord[]> {
  const { symbol, interval, from, to, exchange, limit } = params;
  const baseUrl = resolveApiBaseUrl();
  const searchParams = new URLSearchParams();
  searchParams.set('symbol', symbol.trim().toUpperCase());
  searchParams.set('interval', interval);
  if (from) searchParams.set('from', from);
  if (to) searchParams.set('to', to);
  if (exchange) searchParams.set('exchange', exchange);
  if (limit != null) searchParams.set('limit', String(limit));

  const url = `${baseUrl}/charts/klines?${searchParams.toString()}`;
  let data: KlineRecord[] = [];

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch klines: ${response.status}`);
    }
    const json = await response.json();
    if (!Array.isArray(json)) {
      throw new Error('Invalid klines response');
    }
    data = json as KlineRecord[];
  } catch {
    // Backend unreachable (e.g. device can't reach localhost) - try CoinGecko
    const days = interval === '1d' ? 90 : interval === '1h' ? 30 : 7;
    return fetchKlinesFromCoinGecko(symbol.trim().toUpperCase(), days);
  }

  // Backend returned empty - use CoinGecko as fallback
  if (data.length === 0) {
    const days = interval === '1d' ? 90 : interval === '1h' ? 30 : 7;
    return fetchKlinesFromCoinGecko(symbol.trim().toUpperCase(), days);
  }

  return data;
}

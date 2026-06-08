/** A single price history point for sparkline charts */
export interface PricePoint {
  timestamp: number; // Unix ms
  price: number;
}

/** Raw quote data returned from the stock API */
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  lastRefreshed: string;
}

/** UI state for a single ticker in the watchlist */
export interface StockDataState {
  symbol: string;
  price: number;
  previousPrice?: number;
  changeDirection: 'up' | 'down' | 'none';
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  lastRefreshed: string;
  animationKey: number;
  priceHistory: PricePoint[];
  isLoading: boolean;
  error?: string;
}

/** Alpha Vantage Global Quote API response shape */
export interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

/** Alpha Vantage error response */
export interface AlphaVantageError {
  'Error Message'?: string;
  'Note'?: string; // Rate limit note
  'Information'?: string; // API limit info
}

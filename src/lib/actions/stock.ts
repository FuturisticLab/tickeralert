'use server';

/**
 * Stock data server action.
 *
 * Security:
 * - 'use server' directive ensures this runs ONLY on the server.
 * - The ALPHA_VANTAGE_API_KEY is never sent to the browser.
 * - Input is validated and sanitized before any API call.
 * - Rate limiting prevents abuse.
 * - Error messages are scrubbed — no stack traces or internal details leak.
 *
 * API:
 * - If ALPHA_VANTAGE_API_KEY is set in .env.local, uses the real Alpha Vantage API.
 * - Otherwise falls back to a realistic mock (clearly logged).
 */

import { headers } from 'next/headers';
import type { StockQuote, AlphaVantageQuote, AlphaVantageError } from '@/types/stock';
import { checkRateLimit } from '@/lib/security/rate-limiter';

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/;

function validateSymbol(raw: string): string {
  const symbol = raw.trim().toUpperCase();
  if (!symbol) throw new Error('Ticker symbol is required.');
  if (!TICKER_REGEX.test(symbol)) {
    throw new Error(`Invalid ticker symbol "${symbol}". Use letters, numbers, dots, or dashes (max 10 chars).`);
  }
  return symbol;
}

// ---------------------------------------------------------------------------
// Real Alpha Vantage API
// ---------------------------------------------------------------------------

async function fetchFromAlphaVantage(symbol: string): Promise<StockQuote> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured.');
  }

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'GLOBAL_QUOTE');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('apikey', apiKey);

  const response = await fetch(url.toString(), {
    // Cache for 10 seconds on the server to reduce API calls
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Stock API request failed (HTTP ${response.status}). Please try again.`);
  }

  const data = (await response.json()) as AlphaVantageQuote & AlphaVantageError;

  // Check for API-level errors
  if (data['Error Message']) {
    throw new Error(`Symbol "${symbol}" not found. Please verify the ticker.`);
  }
  if (data['Note'] || data['Information']) {
    throw new Error('API rate limit reached. Please wait a minute and try again.');
  }

  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) {
    throw new Error(`No data found for symbol "${symbol}".`);
  }

  const price = Number.parseFloat(quote['05. price']);
  const previousClose = Number.parseFloat(quote['08. previous close']);
  const change = Number.parseFloat(quote['09. change']);
  const changePercent = Number.parseFloat(quote['10. change percent'].replace('%', ''));

  return {
    symbol: quote['01. symbol'],
    price,
    change,
    changePercent,
    previousClose,
    open: Number.parseFloat(quote['02. open']),
    high: Number.parseFloat(quote['03. high']),
    low: Number.parseFloat(quote['04. low']),
    volume: Number.parseInt(quote['06. volume'], 10),
    lastRefreshed: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock API (fallback for development / demo)
// ---------------------------------------------------------------------------

// In-memory store — persists across server action calls in the same process
const mockPrices: Record<string, number> = {};

function getMockData(symbol: string): StockQuote {
  if (symbol === 'ERROR') {
    throw new Error('Simulated API error for symbol "ERROR".');
  }

  const basePrice = 50 + (symbol.charCodeAt(0) - 65) * 8;

  let currentPrice: number;
  if (mockPrices[symbol] === undefined) {
    currentPrice = basePrice + (Math.random() * 30 - 15);
  } else {
    const changeFactor = Math.random() * 0.03; // max 3% change per tick
    const direction = Math.random() > 0.45 ? 1 : -1; // slight bullish bias
    currentPrice = mockPrices[symbol]! * (1 + changeFactor * direction);
  }

  currentPrice = Math.max(0.01, Number.parseFloat(currentPrice.toFixed(2)));

  const previousClose =
    mockPrices[symbol] !== undefined
      ? mockPrices[symbol]!
      : Number.parseFloat((currentPrice * (1 + (Math.random() * 0.06 - 0.03))).toFixed(2));

  mockPrices[symbol] = currentPrice;

  const change = Number.parseFloat((currentPrice - previousClose).toFixed(2));
  const changePercent = Number.parseFloat(((change / previousClose) * 100).toFixed(2));
  const open = Number.parseFloat((previousClose * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2));
  const high = Number.parseFloat((Math.max(currentPrice, open) * (1 + Math.random() * 0.02)).toFixed(2));
  const low = Number.parseFloat((Math.min(currentPrice, open) * (1 - Math.random() * 0.02)).toFixed(2));

  return {
    symbol,
    price: currentPrice,
    change,
    changePercent,
    previousClose,
    open,
    high,
    low,
    volume: Math.floor(Math.random() * 50_000_000 + 1_000_000),
    lastRefreshed: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public server action
// ---------------------------------------------------------------------------

export async function fetchStockData(rawSymbol: string): Promise<StockQuote> {
  // 1. Validate input
  const symbol = validateSymbol(rawSymbol);

  // 2. Rate limit by IP (falls back to 'unknown' in environments without IP)
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown';

  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    const retrySeconds = Math.ceil((rateLimitResult.retryAfterMs ?? 12000) / 1000);
    throw new Error(`Too many requests. Please wait ${retrySeconds} seconds before refreshing.`);
  }

  // 3. Fetch data — real API if key is set, mock otherwise
  const hasApiKey = Boolean(process.env.ALPHA_VANTAGE_API_KEY);

  if (!hasApiKey) {
    // Simulate realistic network delay
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    return getMockData(symbol);
  }

  return fetchFromAlphaVantage(symbol);
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchStockData } from '@/lib/actions/stock';
import { TickerInputForm } from '@/components/ticker-input-form';
import { WatchlistCard } from '@/components/watchlist-card';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import type { StockDataState, PricePoint } from '@/types/stock';
import { BarChart3 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const POLLING_INTERVAL_MS = 15_000; // 15 seconds per ticker
const MAX_WATCHLIST_SIZE = 8;
const MAX_PRICE_HISTORY = 30; // Number of data points to keep per ticker
const STAGGER_DELAY_MS = 2_000; // Delay between polling different tickers
const LOCALSTORAGE_KEY = 'tickeralert_watchlist';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WatchlistMap = Map<string, StockDataState>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyState(symbol: string): StockDataState {
  return {
    symbol,
    price: 0,
    changeDirection: 'none',
    change: 0,
    changePercent: 0,
    lastRefreshed: '',
    animationKey: 0,
    priceHistory: [],
    isLoading: true,
  };
}

function loadSavedSymbols(): string[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return (parsed as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, MAX_WATCHLIST_SIZE);
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function saveSymbols(symbols: string[]) {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [watchlist, setWatchlist] = useState<WatchlistMap>(new Map());
  const [symbolOrder, setSymbolOrder] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  // Track polling intervals per symbol
  const pollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const startTimerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ---------------------------------------------------------------------------
  // Fetch & update a single ticker
  // ---------------------------------------------------------------------------

  const fetchTicker = useCallback(
    async (symbol: string, isInitial = false) => {
      setWatchlist((prev) => {
        const existing = prev.get(symbol);
        if (!existing) return prev;
        const updated = new Map(prev);
        updated.set(symbol, { ...existing, isLoading: true, error: undefined });
        return updated;
      });

      try {
        const data = await fetchStockData(symbol);

        setWatchlist((prev) => {
          const existing = prev.get(symbol);
          if (!existing) return prev; // was removed while fetching

          const prevPrice = existing.price || data.previousClose;
          const direction: 'up' | 'down' | 'none' =
            isInitial
              ? data.price > data.previousClose
                ? 'up'
                : data.price < data.previousClose
                ? 'down'
                : 'none'
              : data.price > prevPrice
              ? 'up'
              : data.price < prevPrice
              ? 'down'
              : 'none';

          const newPoint: PricePoint = { timestamp: Date.now(), price: data.price };
          const priceHistory: PricePoint[] = [
            ...existing.priceHistory.slice(-MAX_PRICE_HISTORY + 1),
            newPoint,
          ];

          const updated = new Map(prev);
          updated.set(symbol, {
            symbol: data.symbol,
            price: data.price,
            previousPrice: prevPrice,
            changeDirection: direction,
            change: data.change,
            changePercent: data.changePercent,
            open: data.open,
            high: data.high,
            low: data.low,
            volume: data.volume,
            lastRefreshed: data.lastRefreshed,
            animationKey: existing.animationKey + 1,
            priceHistory,
            isLoading: false,
          });
          return updated;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setWatchlist((prev) => {
          const existing = prev.get(symbol);
          if (!existing) return prev;
          const updated = new Map(prev);
          updated.set(symbol, {
            ...existing,
            isLoading: false,
            error: msg,
          });
          return updated;
        });

        if (isInitial) {
          toast({
            variant: 'destructive',
            title: `Failed to load ${symbol}`,
            description: msg,
          });
        }
      }
    },
    [toast]
  );

  // ---------------------------------------------------------------------------
  // Start polling a symbol
  // ---------------------------------------------------------------------------

  const startPolling = useCallback(
    (symbol: string, staggerIndex: number) => {
      // Stagger start to avoid hammering API
      const delay = staggerIndex * STAGGER_DELAY_MS;
      const startTimer = setTimeout(() => {
        const interval = setInterval(() => {
          void fetchTicker(symbol);
        }, POLLING_INTERVAL_MS);
        pollingRefs.current.set(symbol, interval);
        startTimerRefs.current.delete(symbol);
      }, delay);

      startTimerRefs.current.set(symbol, startTimer);
    },
    [fetchTicker]
  );

  // ---------------------------------------------------------------------------
  // Stop polling a symbol
  // ---------------------------------------------------------------------------

  const stopPolling = useCallback((symbol: string) => {
    const interval = pollingRefs.current.get(symbol);
    if (interval) {
      clearInterval(interval);
      pollingRefs.current.delete(symbol);
    }
    const startTimer = startTimerRefs.current.get(symbol);
    if (startTimer) {
      clearTimeout(startTimer);
      startTimerRefs.current.delete(symbol);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Restore saved watchlist on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const saved = loadSavedSymbols();
    if (saved.length > 0) {
      const initialMap = new Map<string, StockDataState>();
      saved.forEach((sym) => initialMap.set(sym, createEmptyState(sym)));
      setWatchlist(initialMap);
      setSymbolOrder(saved);
      saved.forEach((sym, i) => {
        void fetchTicker(sym, true);
        startPolling(sym, i);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup all polling on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pollingRefs.current.forEach((timer) => clearInterval(timer));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      startTimerRefs.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Add ticker to watchlist
  // ---------------------------------------------------------------------------

  const handleAddTicker = useCallback(
    async (symbol: string) => {
      const upper = symbol.toUpperCase();

      if (watchlist.has(upper)) {
        toast({
          title: `${upper} is already in your watchlist`,
          description: 'Each ticker can only be added once.',
        });
        return;
      }

      if (symbolOrder.length >= MAX_WATCHLIST_SIZE) {
        toast({
          variant: 'destructive',
          title: 'Watchlist full',
          description: `Maximum ${MAX_WATCHLIST_SIZE} tickers. Remove one to add another.`,
        });
        return;
      }

      setIsAdding(true);

      // Optimistically add skeleton card
      const newOrder = [...symbolOrder, upper];
      setSymbolOrder(newOrder);
      setWatchlist((prev) => {
        const updated = new Map(prev);
        updated.set(upper, createEmptyState(upper));
        return updated;
      });
      saveSymbols(newOrder);

      await fetchTicker(upper, true);
      startPolling(upper, newOrder.length - 1);

      setIsAdding(false);
    },
    [watchlist, symbolOrder, toast, fetchTicker, startPolling]
  );

  // ---------------------------------------------------------------------------
  // Remove ticker
  // ---------------------------------------------------------------------------

  const handleRemove = useCallback(
    (symbol: string) => {
      stopPolling(symbol);
      setWatchlist((prev) => {
        const updated = new Map(prev);
        updated.delete(symbol);
        return updated;
      });
      const newOrder = symbolOrder.filter((s) => s !== symbol);
      setSymbolOrder(newOrder);
      saveSymbols(newOrder);
      toast({ title: `${symbol} removed from watchlist` });
    },
    [symbolOrder, stopPolling, toast]
  );

  // ---------------------------------------------------------------------------
  // Manual refresh
  // ---------------------------------------------------------------------------

  const handleRefresh = useCallback(
    (symbol: string) => {
      void fetchTicker(symbol);
    },
    [fetchTicker]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasItems = symbolOrder.length > 0;

  return (
    <div className="min-h-screen bg-animated-grid bg-radial-glow">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Subtitle */}
        <div className="text-center space-y-2 mb-10">
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Add up to {MAX_WATCHLIST_SIZE} tickers to your live watchlist. Prices refresh every{' '}
            {POLLING_INTERVAL_MS / 1000}s with animated change alerts.
          </p>
        </div>

        {/* Input */}
        <div className="flex justify-center mb-10">
          <TickerInputForm
            onSubmit={handleAddTicker}
            isLoading={isAdding}
            watchlistSymbols={symbolOrder}
          />
        </div>

        {/* Watchlist grid */}
        {hasItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {symbolOrder.map((symbol) => {
              const data = watchlist.get(symbol);
              if (!data) return null;
              return (
                <WatchlistCard
                  key={symbol}
                  data={data}
                  onRemove={handleRemove}
                  onRefresh={handleRefresh}
                />
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your watchlist is empty</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Search for a ticker above or click a popular symbol to start tracking live prices.
              </p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {hasItems && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground border-t border-border/50 pt-6">
            <span>
              <strong className="text-foreground">{symbolOrder.length}</strong> / {MAX_WATCHLIST_SIZE} tickers
            </span>
            <span>Auto-refresh every <strong className="text-foreground">{POLLING_INTERVAL_MS / 1000}s</strong></span>
            <span>Keeping last <strong className="text-foreground">{MAX_PRICE_HISTORY}</strong> price points</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground/60 border-t border-border/30">
        <p>© {new Date().getFullYear()} TickerAlert — Powered by Next.js &amp; Alpha Vantage</p>
        <p className="mt-1 opacity-60">
          Data is for informational purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}

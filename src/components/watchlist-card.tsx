'use client';

import { useCallback } from 'react';
import type { StockDataState } from '@/types/stock';
import { PriceChart } from './price-chart';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface WatchlistCardProps {
  data: StockDataState;
  onRemove: (symbol: string) => void;
  onRefresh: (symbol: string) => void;
}

function formatVolume(vol?: number): string {
  if (!vol) return '—';
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return vol.toLocaleString();
}

export function WatchlistCard({ data, onRemove, onRefresh }: WatchlistCardProps) {
  const {
    symbol,
    price,
    change,
    changePercent,
    changeDirection,
    high,
    low,
    volume,
    lastRefreshed,
    animationKey,
    priceHistory,
    isLoading,
    error,
  } = data;

  const isUp = changeDirection === 'up';
  const isDown = changeDirection === 'down';

  const ChangeIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const priceColorClass = isUp
    ? 'text-price-positive'
    : isDown
    ? 'text-price-negative'
    : 'text-price-neutral';

  const flashClass = isUp
    ? 'price-flash-up'
    : isDown
    ? 'price-flash-down'
    : '';

  const handleRefresh = useCallback(() => onRefresh(symbol), [onRefresh, symbol]);
  const handleRemove = useCallback(() => onRemove(symbol), [onRemove, symbol]);

  // Skeleton state (first load)
  if (isLoading && priceHistory.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in" aria-label={`Loading ${symbol}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-6 w-16 rounded" />
            <div className="skeleton-shimmer h-4 w-24 rounded" />
          </div>
          <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
        </div>
        <div className="skeleton-shimmer h-10 w-32 rounded" />
        <div className="skeleton-shimmer h-16 w-full rounded" />
        <div className="flex gap-4">
          <div className="skeleton-shimmer h-4 w-20 rounded" />
          <div className="skeleton-shimmer h-4 w-20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      id={`watchlist-card-${symbol}`}
      className={cn(
        'glass-card rounded-xl p-5 space-y-4 animate-ticker-add transition-all duration-300',
        flashClass
      )}
      key={animationKey}
      aria-label={`${symbol} stock card`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">
              {symbol}
            </span>
            {isLoading && (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lastRefreshed
              ? `Updated ${new Date(lastRefreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Fetching...'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            id={`refresh-${symbol}`}
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
            aria-label={`Refresh ${symbol}`}
            title="Refresh"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
          <button
            id={`remove-${symbol}`}
            onClick={handleRemove}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Remove ${symbol} from watchlist`}
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
          {error}
        </div>
      )}

      {/* Price */}
      {!error && (
        <>
          <div className="flex items-end gap-3">
            <div
              className={cn(
                'text-4xl font-mono font-bold tracking-tight leading-none animate-number-in',
                priceColorClass
              )}
              key={`price-${animationKey}`}
            >
              ${price.toFixed(2)}
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-semibold mb-0.5 animate-number-in',
                priceColorClass
              )}
              key={`change-${animationKey}`}
            >
              <ChangeIcon className="w-4 h-4" />
              <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}</span>
              <span className="opacity-75">
                ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Sparkline chart */}
          <PriceChart data={priceHistory} direction={changeDirection} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border/50">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">High</p>
              <p className="text-xs font-mono font-medium text-foreground/80">
                {high ? `$${high.toFixed(2)}` : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Low</p>
              <p className="text-xs font-mono font-medium text-foreground/80">
                {low ? `$${low.toFixed(2)}` : '—'}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Volume</p>
              <p className="text-xs font-mono font-medium text-foreground/80">
                {formatVolume(volume)}
              </p>
            </div>
          </div>

          {/* Trend badge */}
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border',
                isUp
                  ? 'text-green-400 border-green-400/20 bg-green-400/08'
                  : isDown
                  ? 'text-red-400 border-red-400/20 bg-red-400/08'
                  : 'text-muted-foreground border-border bg-muted/40'
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {isUp ? 'Trending Up' : isDown ? 'Trending Down' : 'Unchanged'}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <BarChart3 className="w-3 h-3" />
              {priceHistory.length} pts
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarketState {
  isOpen: boolean;
  label: string;
  nextEvent: string;
}

/**
 * Determines US market status based on Eastern Time.
 * NYSE/NASDAQ: Mon–Fri, 09:30–16:00 ET (excluding major holidays).
 * This is a best-effort client-side approximation.
 */
function getMarketState(): MarketState {
  const now = new Date();

  // Convert to US Eastern Time
  const etOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  };

  const etParts = new Intl.DateTimeFormat('en-US', etOptions).formatToParts(now);
  const weekday = etParts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(etParts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(etParts.find((p) => p.type === 'minute')?.value ?? '0', 10);

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;  // 09:30
  const marketClose = 16 * 60;      // 16:00

  if (isWeekend) {
    return { isOpen: false, label: 'Closed', nextEvent: 'Opens Monday 9:30 AM ET' };
  }

  if (timeInMinutes < marketOpen) {
    const preOpen = marketOpen - timeInMinutes;
    const h = Math.floor(preOpen / 60);
    const m = preOpen % 60;
    return {
      isOpen: false,
      label: 'Pre-Market',
      nextEvent: `Opens in ${h > 0 ? `${h}h ` : ''}${m}m`,
    };
  }

  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    const remaining = marketClose - timeInMinutes;
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    return {
      isOpen: true,
      label: 'Market Open',
      nextEvent: `Closes in ${h > 0 ? `${h}h ` : ''}${m}m`,
    };
  }

  return { isOpen: false, label: 'After Hours', nextEvent: 'Opens tomorrow 9:30 AM ET' };
}

export function MarketStatus() {
  const [state, setState] = useState<MarketState>(() => getMarketState());

  useEffect(() => {
    const timer = setInterval(() => setState(getMarketState()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
      style={{
        borderColor: state.isOpen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.08)',
        background: state.isOpen ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.04)',
      }}
      title={state.nextEvent}
    >
      {/* Status dot */}
      <span className="relative flex h-2 w-2">
        {state.isOpen && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: 'rgb(34, 197, 94)' }}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            state.isOpen
              ? 'bg-green-400'
              : state.label === 'Pre-Market'
              ? 'bg-yellow-400'
              : 'bg-slate-500'
          )}
        />
      </span>

      <span
        className={cn(
          state.isOpen ? 'text-green-400' : 'text-muted-foreground'
        )}
      >
        {state.label}
      </span>
    </div>
  );
}

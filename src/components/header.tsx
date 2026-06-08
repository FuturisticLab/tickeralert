'use client';

import { TrendingUp, Activity } from 'lucide-react';
import { MarketStatus } from './market-status';

export function Header() {
  return (
    <header className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">
              <span className="text-primary">Ticker</span>
              <span className="text-foreground">Alert</span>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">Real-Time Market Tracker</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <MarketStatus />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import type { PricePoint } from '@/types/stock';

interface PriceChartProps {
  data: PricePoint[];
  direction: 'up' | 'down' | 'none';
}

const UP_COLOR = '#22c55e';
const DOWN_COLOR = '#ef4444';
const NEUTRAL_COLOR = '#64748b';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const price = payload[0]?.value as number;
    const time = payload[0]?.payload?.timestamp as number;
    return (
      <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs shadow-lg">
        <div className="font-mono font-semibold">${price?.toFixed(2)}</div>
        {Boolean(time) && (
          <div className="text-muted-foreground mt-0.5">
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function PriceChart({ data, direction }: PriceChartProps) {
  const color =
    direction === 'up' ? UP_COLOR : direction === 'down' ? DOWN_COLOR : NEUTRAL_COLOR;

  if (data.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">
          {data.length === 0 ? 'Loading chart...' : 'Gathering data...'}
        </span>
      </div>
    );
  }

  const chartData = data.map((p) => ({ price: p.price, timestamp: p.timestamp }));

  // Calculate domain with small padding
  const prices = data.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.15 || 0.5;

  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${direction}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[minPrice - padding, maxPrice + padding]} hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${direction})`}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: 'transparent' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

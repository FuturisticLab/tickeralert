'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Enter a ticker symbol')
    .max(10, 'Too long')
    .regex(/^[A-Z0-9.\-]+$/i, 'Letters, numbers, dots only')
    .transform((v) => v.toUpperCase()),
});

type TickerFormValues = z.infer<typeof formSchema>;

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'IBM'];

interface TickerInputFormProps {
  onSubmit: (ticker: string) => void;
  isLoading: boolean;
  watchlistSymbols: string[];
}

export function TickerInputForm({ onSubmit, isLoading, watchlistSymbols }: TickerInputFormProps) {
  const [inputValue, setInputValue] = useState('');

  const form = useForm<TickerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ticker: '' },
  });

  const handleSubmit = (values: TickerFormValues) => {
    onSubmit(values.ticker);
    form.reset({ ticker: '' });
    setInputValue('');
  };

  const handleQuickAdd = (ticker: string) => {
    if (!watchlistSymbols.includes(ticker)) {
      onSubmit(ticker);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Search form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex items-start gap-2"
        >
          <FormField
            control={form.control}
            name="ticker"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      {...field}
                      id="ticker-input"
                      placeholder="Enter ticker symbol (e.g. AAPL)"
                      className="pl-10 h-12 bg-card/60 border-border/60 text-base font-mono tracking-wider uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:border-primary/50 transition-colors"
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        field.onChange(v);
                        setInputValue(v);
                      }}
                      value={inputValue}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <Button
            id="add-ticker-btn"
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0 gap-2"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Add</span>
          </Button>
        </form>
      </Form>

      {/* Popular tickers quick-add */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Popular:</span>
        {POPULAR_TICKERS.map((ticker) => {
          const alreadyAdded = watchlistSymbols.includes(ticker);
          return (
            <button
              key={ticker}
              id={`quick-add-${ticker}`}
              onClick={() => handleQuickAdd(ticker)}
              disabled={alreadyAdded || isLoading}
              className="ticker-chip"
              style={
                alreadyAdded
                  ? {
                      opacity: 0.4,
                      cursor: 'default',
                      borderColor: 'rgba(0,238,191,0.3)',
                      color: 'hsl(172 100% 55%)',
                    }
                  : undefined
              }
              aria-label={alreadyAdded ? `${ticker} already in watchlist` : `Add ${ticker} to watchlist`}
            >
              {ticker}
              {alreadyAdded && ' ✓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

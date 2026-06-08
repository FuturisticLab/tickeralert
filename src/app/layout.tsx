import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'TickerAlert — Real-Time Stock Watchlist',
  description:
    'Track multiple stocks in real-time with live sparkline charts, instant price change alerts, and a premium dark-mode interface.',
  keywords: ['stocks', 'stock tracker', 'real-time', 'market', 'watchlist', 'finance'],
  authors: [{ name: 'TickerAlert' }],
  openGraph: {
    title: 'TickerAlert — Real-Time Stock Watchlist',
    description: 'Track multiple stocks in real-time with live price alerts and sparkline charts.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

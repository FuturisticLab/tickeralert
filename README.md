<div align="center">

# TickerAlert

### Real-Time Stock Watchlist with Live Price Alerts

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Track up to 8 stocks simultaneously with live sparkline charts, animated price-change alerts, and a premium dark-mode UI — all powered by secure server-side data fetching.

![TickerAlert Watchlist — Full View](src/images/Screenshot%202026-06-07%20225423.png)

</div>

---

## ✨ Features

- **Multi-ticker watchlist** — track up to 8 symbols at once, auto-saved to localStorage
- **Live sparkline charts** — rolling 30-point price history per ticker using Recharts
- **Animated price alerts** — green/red border glow flash on every price change
- **Real-time market status** — live US market open / pre-market / after-hours indicator
- **Quick-add shortcuts** — one-click add for AAPL, MSFT, GOOGL, TSLA, AMZN, NVDA, META, IBM
- **Per-card controls** — manual refresh and remove buttons on every ticker card
- **Staggered polling** — 15s auto-refresh with 2s stagger between tickers to respect API limits
- **Dark glassmorphism UI** — animated grid background, JetBrains Mono price font, smooth micro-animations
- **Secure by design** — API key is server-side only, rate limiting, full HTTP security headers

![TickerAlert — 4-ticker view with sparklines](src/images/Screenshot%202026-06-07%20225232.png)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack) |
| UI Library | [React 19](https://react.dev/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + custom CSS |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Charts | [Recharts](https://recharts.org/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Stock API | [Alpha Vantage](https://www.alphavantage.co/) (with mock fallback) |
| Firebase | [Firebase v12](https://firebase.google.com/) (client + admin SDK scaffolded) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.18+ ([download](https://nodejs.org/))
- **npm** 9+ (included with Node.js)
- A free **Alpha Vantage API key** — [get one here](https://www.alphavantage.co/support/#api-key) *(optional — app runs with mock data without it)*

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/tickeralert.git
cd tickeralert

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API keys (see Environment Variables below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is live.

> **No API key?** No problem. The app ships with a realistic mock data engine that simulates live price changes. Just run `npm run dev` and start adding tickers.

---

## 🔑 Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
# Stock Data API — Alpha Vantage
# Free tier: 25 requests/day, 5 requests/minute
# Leave blank to use the built-in mock data engine
ALPHA_VANTAGE_API_KEY=your_key_here

# Firebase Client (safe to expose — these are public identifiers)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side only — NEVER expose these)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

> ⚠️ **Never commit `.env.local` or any Firebase service account JSON files to source control.** The `.gitignore` is pre-configured to block these automatically.

---

## 📁 Project Structure

```
tickeralert/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design system — Tailwind v4 @theme, animations
│   │   ├── layout.tsx           # Root layout, SEO metadata, font loading
│   │   └── page.tsx             # Main watchlist page with polling logic
│   │
│   ├── components/
│   │   ├── header.tsx           # App header with logo + market status
│   │   ├── market-status.tsx    # Real-time US market open/closed indicator
│   │   ├── price-chart.tsx      # Recharts sparkline area chart
│   │   ├── ticker-input-form.tsx # Search form + popular ticker quick-add
│   │   ├── watchlist-card.tsx   # Per-ticker card with price, chart, stats
│   │   └── ui/                  # shadcn/ui base components (Button, Card, etc.)
│   │
│   ├── lib/
│   │   ├── actions/
│   │   │   └── stock.ts         # Server action — secure Alpha Vantage API call
│   │   ├── firebase/
│   │   │   ├── admin.ts         # Firebase Admin SDK (server-side only)
│   │   │   └── client.ts        # Firebase Client SDK
│   │   ├── security/
│   │   │   └── rate-limiter.ts  # Token bucket rate limiter (IP-keyed)
│   │   └── utils.ts             # cn() class merge utility
│   │
│   ├── images/                  # README screenshots
│   └── types/
│       └── stock.ts             # TypeScript interfaces (StockQuote, StockDataState, etc.)
│
├── .env.local.example           # Environment variable template
├── .gitignore                   # Blocks .env*, service account keys, node_modules
├── next.config.ts               # Security headers (CSP, HSTS, X-Frame-Options)
├── postcss.config.mjs           # Tailwind v4 PostCSS
├── tsconfig.json                # Strict TypeScript + @/* path alias
└── LICENSE                      # MIT
```

---

## 🔒 Security

TickerAlert is built with security as a first-class concern:

| Layer | Implementation |
|---|---|
| **API key protection** | `ALPHA_VANTAGE_API_KEY` is read only in a `'use server'` action — never sent to the browser |
| **HTTP security headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Content-Security-Policy`, `Permissions-Policy` |
| **Rate limiting** | Token bucket limiter (60 tokens, 30/min refill) keyed by IP — prevents API abuse |
| **Input validation** | Ticker symbols validated with Zod regex before any server call |
| **Secret hygiene** | `.gitignore` explicitly blocks all `.env*` files and Firebase service account JSON patterns |
| **Firebase Admin** | Credentials loaded from env vars at runtime — no embedded service account files |

---

## 📈 API Integration

### With Alpha Vantage (Recommended)

1. Get a free API key at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Add to `.env.local`: `ALPHA_VANTAGE_API_KEY=your_key`
3. Restart the dev server — real data loads automatically

**Free tier limits:** 25 requests/day, 5/minute. The built-in rate limiter and 15s polling interval are calibrated to stay within these limits for a single user.

### Mock Data Engine (Default)

When no API key is set, the app uses a realistic mock engine that:
- Generates base prices per symbol (deterministic from ticker name)
- Simulates ±3% price changes per tick with slight bullish bias
- Includes realistic OHLC (open/high/low/close) and volume data
- Adds 400–800ms simulated network delay

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🔮 Roadmap

- [ ] Firebase Auth — user login to sync watchlist across devices
- [ ] Firestore — cloud-persisted watchlists per user
- [ ] Price alerts — push notifications when a price crosses a threshold
- [ ] Portfolio mode — track cost basis and P&L
- [ ] Recharts v3 migration
- [ ] WebSocket real-time feed (replace polling)

---

## 🤝 Contributing

Pull requests are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## ⚠️ Disclaimer

TickerAlert is a **demonstration project** for educational purposes. Price data (especially from the mock engine) is **not financial advice** and should not be used for trading decisions. Always consult a licensed financial advisor.

---

## 📄 License

[MIT](LICENSE) © 2026 TickerAlert Contributors

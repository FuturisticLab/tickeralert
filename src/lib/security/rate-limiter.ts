/**
 * Simple in-memory rate limiter using a token bucket algorithm.
 *
 * This is suitable for single-process deployments (e.g., local dev, single Vercel function).
 * For multi-region or multi-instance deployments, replace with Redis/Upstash.
 *
 * Security properties:
 * - Keyed by a caller identifier (IP address in production, session ID in dev)
 * - Automatically expires old entries to prevent memory leaks
 * - Returns remaining tokens so callers can backoff gracefully
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

// Configuration
const MAX_TOKENS = 60;   // Max requests in the window
const REFILL_RATE = 30; // Tokens added per minute (supports 8 tickers × ~4 polls/min)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Periodic cleanup to prevent memory leaks
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      // Remove buckets that haven't been used in the last 10 minutes
      if (now - bucket.lastRefill > 10 * 60 * 1000) {
        buckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Check rate limit for a given identifier (e.g., IP address or user ID).
 * Returns whether the request is allowed and how many tokens remain.
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  startCleanup();

  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS - 1, lastRefill: now };
    buckets.set(identifier, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  // Refill tokens based on elapsed time
  const minutesElapsed = (now - bucket.lastRefill) / 60000;
  const tokensToAdd = Math.floor(minutesElapsed * REFILL_RATE);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const msUntilRefill = Math.ceil((1 / REFILL_RATE) * 60000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: msUntilRefill,
    };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

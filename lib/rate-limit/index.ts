type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const MAX_STORE_SIZE = 10_000;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;

  if (store.size > MAX_STORE_SIZE) {
    pruneStore(now);
  }

  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { ok: true };
}

function pruneStore(now: number) {
  for (const [key, bucket] of store) {
    if (now >= bucket.resetAt) {
      store.delete(key);
    }
  }
}

export function resetRateLimitStore() {
  store.clear();
}

export const RATE_LIMITS = {
  bookingCreate: { limit: 5, windowMs: 60_000 },
  bookingSlots: { limit: 30, windowMs: 60_000 },
  manageAction: { limit: 10, windowMs: 60_000 },
  manageSlots: { limit: 20, windowMs: 60_000 },
} as const;

export function rateLimitError(retryAfterSeconds: number): string {
  return `Too many requests. Please wait ${retryAfterSeconds} seconds and try again.`;
}

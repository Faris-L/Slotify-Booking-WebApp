import { buildRateLimitKey } from "@/lib/rate-limit/client-key";
import {
  rateLimit,
  RATE_LIMITS,
  rateLimitError,
  type RateLimitResult,
} from "@/lib/rate-limit/index";

type LimitConfig = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];

export async function checkRateLimit(
  namespace: string,
  config: LimitConfig,
  suffix?: string
): Promise<RateLimitResult> {
  const key = await buildRateLimitKey(namespace, suffix);
  return rateLimit(key, config.limit, config.windowMs);
}

export async function enforceRateLimit(
  namespace: string,
  config: LimitConfig,
  suffix?: string
): Promise<string | null> {
  const result = await checkRateLimit(namespace, config, suffix);

  if (!result.ok) {
    return rateLimitError(result.retryAfterSeconds);
  }

  return null;
}

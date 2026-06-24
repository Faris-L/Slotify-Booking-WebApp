import { describe, expect, it, beforeEach, vi } from "vitest";

import { rateLimit, resetRateLimitStore } from "@/lib/rate-limit/index";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests within the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("test-key", 3, 60_000)).toEqual({ ok: true });
    }
  });

  it("blocks requests over the limit", () => {
    rateLimit("test-key", 2, 60_000);
    rateLimit("test-key", 2, 60_000);

    const blocked = rateLimit("test-key", 2, 60_000);

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("resets after the window expires", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    rateLimit("test-key", 1, 1_000);
    expect(rateLimit("test-key", 1, 1_000).ok).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);
    expect(rateLimit("test-key", 1, 1_000).ok).toBe(true);

    vi.restoreAllMocks();
  });
});

import { describe, expect, it } from "vitest";

import {
  computeReminderWindow,
  REMINDER_WINDOW_HOURS,
  REMINDER_WINDOW_TOLERANCE_HOURS,
} from "@/lib/cron/reminders";

describe("computeReminderWindow", () => {
  it("centers the window around the target hours-ahead mark", () => {
    const now = new Date("2026-06-24T10:00:00.000Z");
    const window = computeReminderWindow(now);

    const expectedStart = new Date(
      now.getTime() +
        REMINDER_WINDOW_HOURS * 60 * 60 * 1000 -
        (REMINDER_WINDOW_TOLERANCE_HOURS / 2) * 60 * 60 * 1000
    );
    const expectedEnd = new Date(
      now.getTime() +
        REMINDER_WINDOW_HOURS * 60 * 60 * 1000 +
        (REMINDER_WINDOW_TOLERANCE_HOURS / 2) * 60 * 60 * 1000
    );

    expect(window.start.toISOString()).toBe(expectedStart.toISOString());
    expect(window.end.toISOString()).toBe(expectedEnd.toISOString());
  });

  it("supports custom lead time and tolerance", () => {
    const now = new Date("2026-06-24T10:00:00.000Z");
    const window = computeReminderWindow(now, 48, 2);

    expect(window.start.toISOString()).toBe("2026-06-26T09:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-06-26T11:00:00.000Z");
  });
});

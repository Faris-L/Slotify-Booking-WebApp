import { addMinutes } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { SLOT_MINUTES } from "@/lib/availability/constants";
import type { TimeInterval } from "@/lib/availability/types";

export function zonedDateTime(
  date: string,
  time: string,
  timezone: string
): Date {
  const normalizedTime = time.length === 5 ? `${time}:00` : time.slice(0, 8);
  return fromZonedTime(`${date}T${normalizedTime}`, timezone);
}

export function dayBounds(
  date: string,
  timezone: string
): TimeInterval {
  const start = zonedDateTime(date, "00:00:00", timezone);
  const nextDay = addMinutes(start, 24 * 60);
  return { start, end: nextDay };
}

export function getWeekdayInTimezone(date: string, timezone: string): number {
  return toZonedTime(zonedDateTime(date, "12:00:00", timezone), timezone).getDay();
}

export function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function subtractInterval(
  windows: TimeInterval[],
  block: TimeInterval
): TimeInterval[] {
  const result: TimeInterval[] = [];

  for (const window of windows) {
    if (!overlaps(window, block)) {
      result.push(window);
      continue;
    }

    if (block.start > window.start) {
      result.push({ start: window.start, end: block.start });
    }

    if (block.end < window.end) {
      result.push({ start: block.end, end: window.end });
    }
  }

  return result.filter((window) => window.end > window.start);
}

export function subtractIntervals(
  windows: TimeInterval[],
  blocks: TimeInterval[]
): TimeInterval[] {
  return blocks.reduce(subtractInterval, windows);
}

/** Align upward to the next slot grid boundary in business timezone. */
export function alignToSlotGrid(instant: Date, timezone: string): Date {
  const zoned = toZonedTime(instant, timezone);
  const totalMinutes = zoned.getHours() * 60 + zoned.getMinutes();
  const alignedMinutes =
    Math.ceil(totalMinutes / SLOT_MINUTES) * SLOT_MINUTES;

  const aligned = new Date(zoned);
  aligned.setHours(0, 0, 0, 0);
  aligned.setMinutes(alignedMinutes, 0, 0);

  return fromZonedTime(aligned, timezone);
}

export function intervalsOverlappingDay(
  entries: Array<{ starts_at: string; ends_at: string }>,
  day: TimeInterval
): TimeInterval[] {
  return entries
    .map((entry) => ({
      start: new Date(entry.starts_at),
      end: new Date(entry.ends_at),
    }))
    .filter((interval) => overlaps(interval, day));
}

export function bookingBusyInterval(booking: {
  starts_at: string;
  ends_at: string;
  buffer_minutes: number;
}): TimeInterval {
  return {
    start: new Date(booking.starts_at),
    end: addMinutes(new Date(booking.ends_at), booking.buffer_minutes),
  };
}

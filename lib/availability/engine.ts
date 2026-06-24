import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { BLOCKING_BOOKING_STATUSES, SLOT_MINUTES } from "@/lib/availability/constants";
import {
  alignToSlotGrid,
  bookingBusyInterval,
  dayBounds,
  getWeekdayInTimezone,
  intervalsOverlappingDay,
  overlaps,
  subtractIntervals,
  zonedDateTime,
} from "@/lib/availability/intervals";
import { resolveEmployeeWeek } from "@/lib/schedule/queries";
import type {
  AvailabilityInput,
  AvailabilityTimeOff,
  FreeSlot,
  TimeInterval,
} from "@/lib/availability/types";

function resolveServiceDuration(input: AvailabilityInput): number {
  return input.durationOverrideMinutes ?? input.service.duration_minutes;
}

function isWithinHorizon(
  date: string,
  timezone: string,
  maxHorizonDays: number,
  now: Date
): boolean {
  const todayStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const todayStart = zonedDateTime(todayStr, "00:00:00", timezone);
  const targetStart = zonedDateTime(date, "00:00:00", timezone);
  const horizonEnd = addMinutes(todayStart, maxHorizonDays * 24 * 60);

  return targetStart >= todayStart && targetStart <= horizonEnd;
}

function isWithinLeadTime(slotStart: Date, minLeadMinutes: number, now: Date): boolean {
  return slotStart.getTime() >= now.getTime() + minLeadMinutes * 60 * 1000;
}

function timeOffBlocksForDay(
  timeOff: AvailabilityTimeOff[],
  employeeId: string,
  day: TimeInterval
): TimeInterval[] {
  const relevant = timeOff.filter((entry) => {
    if (entry.scope === "business") {
      return true;
    }

    return entry.employee_id === employeeId;
  });

  return intervalsOverlappingDay(relevant, day);
}

function workingWindowForDay(
  input: AvailabilityInput,
  day: TimeInterval
): TimeInterval[] {
  const weekday = getWeekdayInTimezone(input.date, input.business.timezone);
  const dayHours = resolveEmployeeWeek(
    input.businessHours,
    input.employeeHours
  ).find((row) => row.weekday === weekday);

  if (!dayHours || dayHours.is_closed) {
    return [];
  }

  const window: TimeInterval = {
    start: zonedDateTime(input.date, dayHours.open_time, input.business.timezone),
    end: zonedDateTime(input.date, dayHours.close_time, input.business.timezone),
  };

  if (window.end <= window.start) {
    return [];
  }

  const clipped: TimeInterval = {
    start: window.start < day.start ? day.start : window.start,
    end: window.end > day.end ? day.end : window.end,
  };

  return clipped.end > clipped.start ? [clipped] : [];
}

/**
 * Pure availability calculation for one employee, service, and calendar day.
 * See Tech.md §7 for the algorithm.
 */
export function computeFreeSlots(
  input: AvailabilityInput,
  employeeId: string
): FreeSlot[] {
  const now = input.now ?? new Date();
  const { timezone, min_lead_minutes, max_horizon_days } = input.business;

  if (!isWithinHorizon(input.date, timezone, max_horizon_days, now)) {
    return [];
  }

  const day = dayBounds(input.date, timezone);
  let windows = workingWindowForDay(input, day);

  if (windows.length === 0) {
    return [];
  }

  const blocks = timeOffBlocksForDay(input.timeOff, employeeId, day);
  windows = subtractIntervals(windows, blocks);

  const busy = input.bookings
    .filter((booking) =>
      BLOCKING_BOOKING_STATUSES.includes(
        booking.status as (typeof BLOCKING_BOOKING_STATUSES)[number]
      )
    )
    .map(bookingBusyInterval);

  const durationMinutes = resolveServiceDuration(input);
  const bufferMinutes = input.service.buffer_minutes;
  const footprintMinutes = durationMinutes + bufferMinutes;

  const slots: FreeSlot[] = [];

  for (const window of windows) {
    let cursor = alignToSlotGrid(window.start, timezone);

    while (cursor.getTime() + footprintMinutes * 60 * 1000 <= window.end.getTime()) {
      const footprint: TimeInterval = {
        start: cursor,
        end: addMinutes(cursor, footprintMinutes),
      };

      const blocked = busy.some((interval) => overlaps(footprint, interval));

      if (
        !blocked &&
        isWithinLeadTime(cursor, min_lead_minutes, now) &&
        footprint.end <= window.end
      ) {
        slots.push({ startsAt: cursor.toISOString() });
      }

      cursor = addMinutes(cursor, SLOT_MINUTES);
    }
  }

  return slots;
}

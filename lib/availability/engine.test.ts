import { describe, expect, it } from "vitest";

import { SLOT_MINUTES } from "@/lib/availability/constants";
import { computeFreeSlots } from "@/lib/availability/engine";
import {
  alignToSlotGrid,
  subtractIntervals,
  zonedDateTime,
} from "@/lib/availability/intervals";
import type { AvailabilityInput } from "@/lib/availability/types";
import type { BusinessHoursRow, EmployeeHoursRow } from "@/lib/schedule/queries";

const TIMEZONE = "Europe/Sarajevo";
const EMPLOYEE_ID = "emp-1";

function weekdayHours(
  weekday: number,
  open = "09:00:00",
  close = "17:00:00",
  isClosed = false
): BusinessHoursRow {
  return {
    id: `bh-${weekday}`,
    weekday,
    open_time: open,
    close_time: close,
    is_closed: isClosed,
  };
}

function defaultBusinessHours(): BusinessHoursRow[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekdayHours(weekday, "09:00:00", "17:00:00", weekday === 0 || weekday === 6)
  );
}

function baseInput(
  overrides: Partial<AvailabilityInput> & { date: string }
): AvailabilityInput {
  return {
    business: {
      timezone: TIMEZONE,
      min_lead_minutes: 0,
      max_horizon_days: 60,
    },
    businessHours: defaultBusinessHours(),
    employeeHours: [] as EmployeeHoursRow[],
    service: {
      duration_minutes: 60,
      buffer_minutes: 0,
    },
    durationOverrideMinutes: null,
    timeOff: [],
    bookings: [],
    now: zonedDateTime(overrides.date, "08:00:00", TIMEZONE),
    ...overrides,
  };
}

function slotStarts(slots: ReturnType<typeof computeFreeSlots>): string[] {
  return slots.map((slot) => slot.startsAt);
}

function localTime(iso: string): string {
  const date = new Date(iso);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
}

describe("interval utilities", () => {
  it("subtracts a block from the middle of a window", () => {
    const windows = [
      {
        start: zonedDateTime("2030-06-03", "09:00:00", TIMEZONE),
        end: zonedDateTime("2030-06-03", "17:00:00", TIMEZONE),
      },
    ];
    const block = {
      start: zonedDateTime("2030-06-03", "12:00:00", TIMEZONE),
      end: zonedDateTime("2030-06-03", "13:00:00", TIMEZONE),
    };

    const result = subtractIntervals(windows, [block]);
    expect(result).toHaveLength(2);
    expect(localTime(result[0]!.end.toISOString())).toBe("12:00");
    expect(localTime(result[1]!.start.toISOString())).toBe("13:00");
  });

  it("aligns to the 15-minute grid in business timezone", () => {
    const instant = zonedDateTime("2030-06-03", "09:07:00", TIMEZONE);
    const aligned = alignToSlotGrid(instant, TIMEZONE);
    expect(localTime(aligned.toISOString())).toBe("09:15");
  });
});

describe("computeFreeSlots", () => {
  it("returns 15-minute slots for a standard weekday", () => {
    const input = baseInput({ date: "2030-06-03" }); // Monday
    const slots = computeFreeSlots(input, EMPLOYEE_ID);

    expect(slots.length).toBeGreaterThan(0);
    expect(localTime(slots[0]!.startsAt)).toBe("09:00");
    expect(localTime(slots.at(-1)!.startsAt)).toBe("16:00");
  });

  it("returns no slots on a closed day", () => {
    const input = baseInput({ date: "2030-06-02" }); // Sunday
    expect(computeFreeSlots(input, EMPLOYEE_ID)).toEqual([]);
  });

  it("respects employee closed override", () => {
    const employeeHours: EmployeeHoursRow[] = [
      {
        id: "eh-1",
        employee_id: EMPLOYEE_ID,
        weekday: 1,
        open_time: "09:00:00",
        close_time: "17:00:00",
        is_closed: true,
      },
    ];

    const input = baseInput({ date: "2030-06-03", employeeHours });
    expect(computeFreeSlots(input, EMPLOYEE_ID)).toEqual([]);
  });

  it("removes slots overlapping a lunch break", () => {
    const input = baseInput({
      date: "2030-06-03",
      timeOff: [
        {
          scope: "employee",
          type: "break",
          employee_id: EMPLOYEE_ID,
          starts_at: zonedDateTime("2030-06-03", "12:00:00", TIMEZONE).toISOString(),
          ends_at: zonedDateTime("2030-06-03", "13:00:00", TIMEZONE).toISOString(),
        },
      ],
    });

    const starts = slotStarts(computeFreeSlots(input, EMPLOYEE_ID));
    expect(starts.some((iso) => localTime(iso) === "11:00")).toBe(true);
    expect(starts.some((iso) => localTime(iso) === "12:00")).toBe(false);
    expect(starts.some((iso) => localTime(iso) === "13:00")).toBe(true);
  });

  it("blocks slots occupied by an existing booking including buffer", () => {
    const input = baseInput({
      date: "2030-06-03",
      service: { duration_minutes: 60, buffer_minutes: 15 },
      bookings: [
        {
          starts_at: zonedDateTime("2030-06-03", "10:00:00", TIMEZONE).toISOString(),
          ends_at: zonedDateTime("2030-06-03", "11:00:00", TIMEZONE).toISOString(),
          buffer_minutes: 15,
          status: "confirmed",
        },
      ],
    });

    const starts = slotStarts(computeFreeSlots(input, EMPLOYEE_ID));
    expect(starts.some((iso) => localTime(iso) === "10:00")).toBe(false);
    expect(starts.some((iso) => localTime(iso) === "11:00")).toBe(false);
    expect(starts.some((iso) => localTime(iso) === "11:15")).toBe(true);
  });

  it("ignores cancelled bookings", () => {
    const input = baseInput({
      date: "2030-06-03",
      bookings: [
        {
          starts_at: zonedDateTime("2030-06-03", "10:00:00", TIMEZONE).toISOString(),
          ends_at: zonedDateTime("2030-06-03", "11:00:00", TIMEZONE).toISOString(),
          buffer_minutes: 0,
          status: "cancelled",
        },
      ],
    });

    expect(slotStarts(computeFreeSlots(input, EMPLOYEE_ID))).toContain(
      zonedDateTime("2030-06-03", "10:00:00", TIMEZONE).toISOString()
    );
  });

  it("enforces minimum lead time", () => {
    const input = baseInput({
      date: "2030-06-03",
      business: {
        timezone: TIMEZONE,
        min_lead_minutes: 120,
        max_horizon_days: 60,
      },
      now: zonedDateTime("2030-06-03", "09:30:00", TIMEZONE),
    });

    const starts = slotStarts(computeFreeSlots(input, EMPLOYEE_ID));
    expect(starts.some((iso) => localTime(iso) === "09:00")).toBe(false);
    expect(starts.some((iso) => localTime(iso) === "11:30")).toBe(true);
  });

  it("returns empty when date is beyond max horizon", () => {
    const input = baseInput({
      date: "2031-01-01",
      business: {
        timezone: TIMEZONE,
        min_lead_minutes: 0,
        max_horizon_days: 30,
      },
      now: zonedDateTime("2030-06-03", "08:00:00", TIMEZONE),
    });

    expect(computeFreeSlots(input, EMPLOYEE_ID)).toEqual([]);
  });

  it("excludes slots that do not fit before closing with buffer", () => {
    const input = baseInput({
      date: "2030-06-03",
      service: { duration_minutes: 60, buffer_minutes: 30 },
    });

    const starts = slotStarts(computeFreeSlots(input, EMPLOYEE_ID));
    expect(starts.some((iso) => localTime(iso) === "16:00")).toBe(false);
    expect(starts.at(-1)).toBeDefined();
    expect(localTime(starts.at(-1)!)).toBe("15:30");
  });

  it("uses employee duration override", () => {
    const input = baseInput({
      date: "2030-06-03",
      durationOverrideMinutes: 90,
      service: { duration_minutes: 60, buffer_minutes: 0 },
    });

    const starts = slotStarts(computeFreeSlots(input, EMPLOYEE_ID));
    expect(starts.at(-1)).toBeDefined();
    expect(localTime(starts.at(-1)!)).toBe("15:30");
  });

  it("blocks business-wide holidays", () => {
    const input = baseInput({
      date: "2030-06-03",
      timeOff: [
        {
          scope: "business",
          type: "holiday",
          employee_id: null,
          starts_at: zonedDateTime("2030-06-03", "00:00:00", TIMEZONE).toISOString(),
          ends_at: zonedDateTime("2030-06-04", "00:00:00", TIMEZONE).toISOString(),
        },
      ],
    });

    expect(computeFreeSlots(input, EMPLOYEE_ID)).toEqual([]);
  });

  it("spaces consecutive slots by SLOT_MINUTES", () => {
    const input = baseInput({ date: "2030-06-03" });
    const slots = computeFreeSlots(input, EMPLOYEE_ID).slice(0, 4);
    const gaps = slots.slice(1).map((slot, index) => {
      const prev = new Date(slots[index]!.startsAt).getTime();
      const current = new Date(slot.startsAt).getTime();
      return (current - prev) / (60 * 1000);
    });

    expect(gaps.every((gap) => gap === SLOT_MINUTES)).toBe(true);
  });
});

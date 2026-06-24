import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { getFreeSlots } from "@/lib/availability";
import { createAdminClient } from "@/utils/supabase/admin";

export type AvailableSlot = {
  startsAt: string;
  employeeId: string;
};

export function getBookableDates(
  timezone: string,
  maxHorizonDays: number
): string[] {
  const zonedNow = toZonedTime(new Date(), timezone);
  const dates: string[] = [];

  for (let offset = 0; offset <= maxHorizonDays; offset += 1) {
    dates.push(format(addDays(zonedNow, offset), "yyyy-MM-dd"));
  }

  return dates;
}

export async function getAvailableSlotsForEmployee(
  supabase: SupabaseClient,
  params: {
    businessId: string;
    employeeId: string;
    serviceId: string;
    date: string;
    excludeBookingId?: string;
  }
): Promise<AvailableSlot[]> {
  const slots = await getFreeSlots(supabase, params);

  return slots.map((slot) => ({
    startsAt: slot.startsAt,
    employeeId: params.employeeId,
  }));
}

export async function getAvailableSlotsForAnyEmployee(
  supabase: SupabaseClient,
  params: {
    businessId: string;
    serviceId: string;
    date: string;
    employeeIds: string[];
    excludeBookingId?: string;
  }
): Promise<AvailableSlot[]> {
  if (params.employeeIds.length === 0) {
    return [];
  }

  const perEmployee = await Promise.all(
    params.employeeIds.map((employeeId) =>
      getAvailableSlotsForEmployee(supabase, {
        businessId: params.businessId,
        employeeId,
        serviceId: params.serviceId,
        date: params.date,
        excludeBookingId: params.excludeBookingId,
      })
    )
  );

  const byStart = new Map<string, AvailableSlot>();

  for (const slots of perEmployee) {
    for (const slot of slots) {
      if (!byStart.has(slot.startsAt)) {
        byStart.set(slot.startsAt, slot);
      }
    }
  }

  return Array.from(byStart.values()).sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt)
  );
}

/** Server-only: uses service role so existing bookings are visible to the engine. */
export async function getAvailableSlots(params: {
  businessId: string;
  serviceId: string;
  date: string;
  employeeId: string | null;
  employeeIds: string[];
  excludeBookingId?: string;
}): Promise<AvailableSlot[]> {
  const supabase = createAdminClient();

  if (params.employeeId) {
    return getAvailableSlotsForEmployee(supabase, {
      businessId: params.businessId,
      employeeId: params.employeeId,
      serviceId: params.serviceId,
      date: params.date,
      excludeBookingId: params.excludeBookingId,
    });
  }

  return getAvailableSlotsForAnyEmployee(supabase, {
    businessId: params.businessId,
    serviceId: params.serviceId,
    date: params.date,
    employeeIds: params.employeeIds,
    excludeBookingId: params.excludeBookingId,
  });
}

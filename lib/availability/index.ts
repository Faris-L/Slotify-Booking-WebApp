import type { SupabaseClient } from "@supabase/supabase-js";

import { computeFreeSlots } from "@/lib/availability/engine";
import {
  loadAvailabilityInput,
  type FreeSlotsQueryParams,
} from "@/lib/availability/queries";
import type { FreeSlot } from "@/lib/availability/types";

export type { FreeSlotsQueryParams };

/**
 * Server-side entry point: returns free slot starts for one employee/service/day.
 * All times are returned as UTC ISO strings; display in business timezone.
 */
export async function getFreeSlots(
  supabase: SupabaseClient,
  params: FreeSlotsQueryParams
): Promise<FreeSlot[]> {
  const loaded = await loadAvailabilityInput(supabase, params);

  if (!loaded) {
    return [];
  }

  return computeFreeSlots(loaded.input, params.employeeId);
}

export { computeFreeSlots } from "@/lib/availability/engine";
export type {
  AvailabilityInput,
  AvailabilityBooking,
  AvailabilityBusiness,
  AvailabilityService,
  AvailabilityTimeOff,
  FreeSlot,
  TimeInterval,
} from "@/lib/availability/types";

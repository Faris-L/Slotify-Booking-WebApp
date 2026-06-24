import type { SupabaseClient } from "@supabase/supabase-js";

import { dayBounds } from "@/lib/availability/intervals";
import type {
  AvailabilityBooking,
  AvailabilityBusiness,
  AvailabilityInput,
  AvailabilityService,
  AvailabilityTimeOff,
} from "@/lib/availability/types";
import {
  getBusinessHours,
  getEmployeeHours,
  type BusinessHoursRow,
  type EmployeeHoursRow,
} from "@/lib/schedule/queries";

export type FreeSlotsQueryParams = {
  businessId: string;
  employeeId: string;
  serviceId: string;
  /** Calendar date in business timezone (YYYY-MM-DD). */
  date: string;
  /** When rescheduling, exclude this booking from busy intervals. */
  excludeBookingId?: string;
};

type BusinessAvailabilityRow = AvailabilityBusiness & { id: string };

async function getBusinessForAvailability(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessAvailabilityRow | null> {
  const { data, error } = await supabase
    .from("book_businesses")
    .select("id, timezone, min_lead_minutes, max_horizon_days")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getServiceForAvailability(
  supabase: SupabaseClient,
  businessId: string,
  serviceId: string
): Promise<AvailabilityService | null> {
  const { data, error } = await supabase
    .from("book_services")
    .select("duration_minutes, buffer_minutes")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getEmployeeServiceDurationOverride(
  supabase: SupabaseClient,
  employeeId: string,
  serviceId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("book_employee_services")
    .select("duration_override_minutes")
    .eq("employee_id", employeeId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.duration_override_minutes ?? null;
}

async function getTimeOffForDay(
  supabase: SupabaseClient,
  businessId: string,
  date: string,
  timezone: string
): Promise<AvailabilityTimeOff[]> {
  const { start: dayStart, end: dayEnd } = dayBounds(date, timezone);

  const { data, error } = await supabase
    .from("book_time_off")
    .select("scope, type, starts_at, ends_at, employee_id")
    .eq("business_id", businessId)
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());

  if (error) {
    throw error;
  }

  return (data ?? []) as AvailabilityTimeOff[];
}

async function getBookingsForDay(
  supabase: SupabaseClient,
  businessId: string,
  employeeId: string,
  date: string,
  timezone: string,
  excludeBookingId?: string
): Promise<AvailabilityBooking[]> {
  const { start: dayStart, end: dayEnd } = dayBounds(date, timezone);

  let query = supabase
    .from("book_bookings")
    .select("starts_at, ends_at, buffer_minutes, status")
    .eq("business_id", businessId)
    .eq("employee_id", employeeId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", dayEnd.toISOString())
    .gt("ends_at", dayStart.toISOString());

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    buffer_minutes: row.buffer_minutes ?? 0,
  }));
}

export async function loadAvailabilityInput(
  supabase: SupabaseClient,
  params: FreeSlotsQueryParams
): Promise<{
  input: AvailabilityInput;
  businessHours: BusinessHoursRow[];
  employeeHours: EmployeeHoursRow[];
} | null> {
  const business = await getBusinessForAvailability(
    supabase,
    params.businessId
  );

  if (!business) {
    return null;
  }

  const [service, durationOverride, businessHours, employeeHours, timeOff, bookings] =
    await Promise.all([
      getServiceForAvailability(supabase, params.businessId, params.serviceId),
      getEmployeeServiceDurationOverride(
        supabase,
        params.employeeId,
        params.serviceId
      ),
      getBusinessHours(supabase, params.businessId),
      getEmployeeHours(supabase, params.businessId, params.employeeId),
      getTimeOffForDay(
        supabase,
        params.businessId,
        params.date,
        business.timezone
      ),
      getBookingsForDay(
        supabase,
        params.businessId,
        params.employeeId,
        params.date,
        business.timezone,
        params.excludeBookingId
      ),
    ]);

  if (!service) {
    return null;
  }

  const input: AvailabilityInput = {
    date: params.date,
    business: {
      timezone: business.timezone,
      min_lead_minutes: business.min_lead_minutes,
      max_horizon_days: business.max_horizon_days,
    },
    businessHours,
    employeeHours,
    service,
    durationOverrideMinutes: durationOverride,
    timeOff,
    bookings,
  };

  return { input, businessHours, employeeHours };
}

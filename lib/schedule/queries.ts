import type { SupabaseClient } from "@supabase/supabase-js";

import { WEEKDAYS } from "@/lib/constants/schedule";
import {
  DEFAULT_CLOSE_TIME,
  DEFAULT_OPEN_TIME,
} from "@/lib/constants/schedule";
import { toDbTimeValue } from "@/lib/schedule/time";

export type BusinessHoursRow = {
  id: string;
  weekday: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type EmployeeHoursRow = {
  id: string;
  employee_id: string;
  weekday: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export type ResolvedDayHours = {
  weekday: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  source: "business" | "employee";
};

export async function getBusinessHours(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessHoursRow[]> {
  const { data, error } = await supabase
    .from("book_business_hours")
    .select("id, weekday, open_time, close_time, is_closed")
    .eq("business_id", businessId)
    .order("weekday", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getEmployeeHours(
  supabase: SupabaseClient,
  businessId: string,
  employeeId: string
): Promise<EmployeeHoursRow[]> {
  const { data, error } = await supabase
    .from("book_employee_hours")
    .select("id, employee_id, weekday, open_time, close_time, is_closed")
    .eq("business_id", businessId)
    .eq("employee_id", employeeId)
    .order("weekday", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAllEmployeeHours(
  supabase: SupabaseClient,
  businessId: string
): Promise<EmployeeHoursRow[]> {
  const { data, error } = await supabase
    .from("book_employee_hours")
    .select("id, employee_id, weekday, open_time, close_time, is_closed")
    .eq("business_id", businessId)
    .order("employee_id", { ascending: true })
    .order("weekday", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function indexHoursByWeekday<T extends { weekday: number }>(
  rows: T[]
): Map<number, T> {
  return new Map(rows.map((row) => [row.weekday, row]));
}

export function resolveEmployeeWeek(
  businessHours: BusinessHoursRow[],
  employeeHours: EmployeeHoursRow[]
): ResolvedDayHours[] {
  const businessByDay = indexHoursByWeekday(businessHours);
  const employeeByDay = indexHoursByWeekday(employeeHours);

  return WEEKDAYS.map(({ value: weekday }) => {
    const override = employeeByDay.get(weekday);
    if (override) {
      return {
        weekday,
        open_time: override.open_time,
        close_time: override.close_time,
        is_closed: override.is_closed,
        source: "employee" as const,
      };
    }

    const businessDay = businessByDay.get(weekday);
    return {
      weekday,
      open_time: businessDay?.open_time ?? DEFAULT_OPEN_TIME,
      close_time: businessDay?.close_time ?? DEFAULT_CLOSE_TIME,
      is_closed: businessDay?.is_closed ?? true,
      source: "business" as const,
    };
  });
}

export function employeeHasOverrides(employeeHours: EmployeeHoursRow[]): boolean {
  return employeeHours.length > 0;
}

export function buildBusinessHoursUpsertRows(
  businessId: string,
  days: Array<{
    weekday: number;
    isClosed: boolean;
    openTime: string;
    closeTime: string;
  }>
) {
  return days.map((day) => ({
    business_id: businessId,
    weekday: day.weekday,
    open_time: toDbTimeValue(day.openTime),
    close_time: toDbTimeValue(day.closeTime),
    is_closed: day.isClosed,
  }));
}

export function buildEmployeeHoursUpsertRows(
  businessId: string,
  employeeId: string,
  days: Array<{
    weekday: number;
    isClosed: boolean;
    openTime: string;
    closeTime: string;
  }>
) {
  return days.map((day) => ({
    business_id: businessId,
    employee_id: employeeId,
    weekday: day.weekday,
    open_time: toDbTimeValue(day.openTime),
    close_time: toDbTimeValue(day.closeTime),
    is_closed: day.isClosed,
  }));
}

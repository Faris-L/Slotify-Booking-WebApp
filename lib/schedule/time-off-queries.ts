import type { SupabaseClient } from "@supabase/supabase-js";

import type { TimeOffScope, TimeOffType } from "@/lib/constants/time-off";

export type TimeOffEntry = {
  id: string;
  business_id: string;
  employee_id: string | null;
  scope: TimeOffScope;
  type: TimeOffType;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  employee: {
    id: string;
    full_name: string;
  } | null;
};

export async function getTimeOffEntries(
  supabase: SupabaseClient,
  businessId: string
): Promise<TimeOffEntry[]> {
  const { data, error } = await supabase
    .from("book_time_off")
    .select(
      `
      id,
      business_id,
      employee_id,
      scope,
      type,
      starts_at,
      ends_at,
      reason,
      employee:book_employees (
        id,
        full_name
      )
    `
    )
    .eq("business_id", businessId)
    .order("starts_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee;

    return {
      id: row.id,
      business_id: row.business_id,
      employee_id: row.employee_id,
      scope: row.scope as TimeOffScope,
      type: row.type as TimeOffType,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      reason: row.reason,
      employee: employee ?? null,
    };
  });
}

export function splitTimeOffEntries(entries: TimeOffEntry[]) {
  return {
    business: entries.filter((entry) => entry.scope === "business"),
    employee: entries.filter((entry) => entry.scope === "employee"),
  };
}

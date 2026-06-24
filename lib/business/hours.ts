import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_CLOSE_TIME,
  DEFAULT_OPEN_TIME,
  WEEKDAYS,
} from "@/lib/constants/schedule";

export async function seedDefaultBusinessHours(
  supabase: SupabaseClient,
  businessId: string
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("book_business_hours")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (countError) {
    throw countError;
  }

  if (count && count > 0) {
    return;
  }

  const rows = WEEKDAYS.map(({ value }) => ({
    business_id: businessId,
    weekday: value,
    open_time: DEFAULT_OPEN_TIME,
    close_time: DEFAULT_CLOSE_TIME,
    is_closed: value === 0 || value === 6,
  }));

  const { error } = await supabase.from("book_business_hours").insert(rows);

  if (error) {
    throw error;
  }
}

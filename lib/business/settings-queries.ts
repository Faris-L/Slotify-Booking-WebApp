import type { SupabaseClient } from "@supabase/supabase-js";

import type { ConfirmationMode } from "@/lib/constants/booking-settings";

export type BusinessSettings = {
  id: string;
  name: string;
  slug: string;
  confirmation_mode: ConfirmationMode;
  min_lead_minutes: number;
  cancel_cutoff_hours: number;
  allow_any_employee: boolean;
};

export async function getBusinessSettings(
  supabase: SupabaseClient,
  businessId: string
): Promise<BusinessSettings | null> {
  const { data, error } = await supabase
    .from("book_businesses")
    .select(
      "id, name, slug, confirmation_mode, min_lead_minutes, cancel_cutoff_hours, allow_any_employee"
    )
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type OwnerBusiness = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  brand_color: string | null;
};

export async function getOwnerBusiness(
  supabase: SupabaseClient,
  ownerId: string
): Promise<OwnerBusiness | null> {
  const { data, error } = await supabase
    .from("book_businesses")
    .select("id, name, slug, timezone, currency, brand_color")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

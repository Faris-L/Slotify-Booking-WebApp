import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type Service = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
};

export async function getServiceCategories(
  supabase: SupabaseClient,
  businessId: string
): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from("book_service_categories")
    .select("id, name, sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getServices(
  supabase: SupabaseClient,
  businessId: string
): Promise<Service[]> {
  const { data, error } = await supabase
    .from("book_services")
    .select(
      "id, business_id, category_id, name, description, duration_minutes, buffer_minutes, price, is_active, created_at"
    )
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
  }));
}

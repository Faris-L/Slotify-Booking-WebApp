import { createAdminClient } from "@/utils/supabase/admin";

import type { BookingStatus } from "@/lib/bookings/types";

export type ManageBookingView = {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  price: number;
  manage_token: string;
  employee_id: string;
  service_id: string;
  business: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
    cancel_cutoff_hours: number;
    max_horizon_days: number;
  };
  employee: { id: string; full_name: string };
  service: { id: string; name: string; duration_minutes: number };
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
};

export async function getBookingByManageToken(
  token: string
): Promise<ManageBookingView | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("book_bookings")
    .select(
      `
      id,
      status,
      starts_at,
      ends_at,
      price,
      manage_token,
      employee_id,
      service_id,
      business:book_businesses!book_bookings_business_id_fkey(
        id, name, slug, timezone, currency, cancel_cutoff_hours, max_horizon_days
      ),
      employee:book_employees!book_bookings_employee_id_fkey(id, full_name),
      service:book_services!book_bookings_service_id_fkey(id, name, duration_minutes),
      client:book_clients!book_bookings_client_id_fkey(id, full_name, email, phone)
    `
    )
    .eq("manage_token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as unknown as ManageBookingView;
}

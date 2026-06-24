import type { SupabaseClient } from "@supabase/supabase-js";
import {
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import type {
  BookingListItem,
  BookingStatus,
  ClientDetail,
  ClientListItem,
  DashboardStats,
} from "@/lib/bookings/types";

const BOOKING_SELECT = `
  id,
  status,
  starts_at,
  ends_at,
  price,
  source,
  manage_token,
  buffer_minutes,
  employee_id,
  service_id,
  client_id,
  employee:book_employees!book_bookings_employee_id_fkey(id, full_name),
  service:book_services!book_bookings_service_id_fkey(id, name, duration_minutes),
  client:book_clients!book_bookings_client_id_fkey(id, full_name, email, phone)
`;

function mapBookingRow(row: Record<string, unknown>): BookingListItem {
  return row as unknown as BookingListItem;
}

export async function getBookingsInRange(
  supabase: SupabaseClient,
  businessId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<BookingListItem[]> {
  const { data, error } = await supabase
    .from("book_bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", businessId)
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapBookingRow);
}

export async function getBookingById(
  supabase: SupabaseClient,
  businessId: string,
  bookingId: string
): Promise<BookingListItem | null> {
  const { data, error } = await supabase
    .from("book_bookings")
    .select(BOOKING_SELECT)
    .eq("business_id", businessId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapBookingRow(data) : null;
}

function getWeekBoundsInTimezone(timezone: string): {
  weekStart: Date;
  weekEnd: Date;
  todayStart: Date;
  todayEnd: Date;
} {
  const zonedNow = toZonedTime(new Date(), timezone);
  const todayStart = startOfDay(zonedNow);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = startOfWeek(zonedNow, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(zonedNow, { weekStartsOn: 1 });
  weekEnd.setMilliseconds(weekEnd.getMilliseconds() + 1);

  return {
    weekStart: fromZonedTime(weekStart, timezone),
    weekEnd: fromZonedTime(weekEnd, timezone),
    todayStart: fromZonedTime(todayStart, timezone),
    todayEnd: fromZonedTime(todayEnd, timezone),
  };
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  businessId: string,
  timezone: string
): Promise<DashboardStats> {
  const { weekStart, weekEnd, todayStart, todayEnd } =
    getWeekBoundsInTimezone(timezone);

  const [weekBookings, clientCountResult] = await Promise.all([
    getBookingsInRange(
      supabase,
      businessId,
      weekStart.toISOString(),
      weekEnd.toISOString()
    ),
    supabase
      .from("book_clients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  const todayBookings = weekBookings.filter(
    (booking) =>
      new Date(booking.starts_at) >= todayStart &&
      new Date(booking.starts_at) < todayEnd
  );

  const statusCounts: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    no_show: 0,
  };

  for (const booking of weekBookings) {
    statusCounts[booking.status] += 1;
  }

  const employeeMap = new Map<string, { name: string; count: number }>();

  for (const booking of todayBookings) {
    const existing = employeeMap.get(booking.employee_id);
    if (existing) {
      existing.count += 1;
    } else {
      employeeMap.set(booking.employee_id, {
        name: booking.employee.full_name,
        count: 1,
      });
    }
  }

  return {
    todayCount: todayBookings.length,
    weekCount: weekBookings.length,
    clientCount: clientCountResult.count ?? 0,
    statusCounts,
    todayByEmployee: Array.from(employeeMap.entries())
      .map(([employeeId, { name, count }]) => ({
        employeeId,
        name,
        count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getClients(
  supabase: SupabaseClient,
  businessId: string
): Promise<ClientListItem[]> {
  const { data: clients, error } = await supabase
    .from("book_clients")
    .select("id, full_name, email, phone, notes, created_at")
    .eq("business_id", businessId)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  const { data: bookingCounts, error: countError } = await supabase
    .from("book_bookings")
    .select("client_id")
    .eq("business_id", businessId);

  if (countError) {
    throw countError;
  }

  const countByClient = new Map<string, number>();
  for (const row of bookingCounts ?? []) {
    countByClient.set(
      row.client_id,
      (countByClient.get(row.client_id) ?? 0) + 1
    );
  }

  return (clients ?? []).map((client) => ({
    ...client,
    booking_count: countByClient.get(client.id) ?? 0,
  }));
}

export async function getClientDetail(
  supabase: SupabaseClient,
  businessId: string,
  clientId: string
): Promise<ClientDetail | null> {
  const { data: client, error } = await supabase
    .from("book_clients")
    .select("id, full_name, email, phone, notes, created_at")
    .eq("business_id", businessId)
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!client) {
    return null;
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("book_bookings")
    .select(
      `
      id,
      status,
      starts_at,
      price,
      service:book_services!book_bookings_service_id_fkey(name),
      employee:book_employees!book_bookings_employee_id_fkey(full_name)
    `
    )
    .eq("business_id", businessId)
    .eq("client_id", clientId)
    .order("starts_at", { ascending: false });

  if (bookingsError) {
    throw bookingsError;
  }

  const { count } = await supabase
    .from("book_bookings")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("client_id", clientId);

  return {
    ...client,
    booking_count: count ?? 0,
    bookings: (bookings ?? []).map((row) => {
      const service = row.service as unknown as { name: string } | null;
      const employee = row.employee as unknown as { full_name: string } | null;
      return {
        id: row.id as string,
        status: row.status as BookingStatus,
        starts_at: row.starts_at as string,
        service_name: service?.name ?? "Service",
        employee_name: employee?.full_name ?? "Staff",
        price: Number(row.price),
      };
    }),
  };
}

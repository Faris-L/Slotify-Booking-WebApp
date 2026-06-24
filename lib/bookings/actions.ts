"use server";

import { revalidatePath } from "next/cache";

import { sendBookingUpdateEmail } from "@/lib/email";
import { getAvailableSlots } from "@/lib/booking/slots";
import { getBookingById } from "@/lib/bookings/queries";
import {
  bookingDurationMinutes,
  computeRescheduleEndsAt,
  isActiveBookingStatus,
  isBookingConflict,
} from "@/lib/bookings/utils";
import { requireOwnerContext } from "@/lib/business/context";
import {
  manualBookingSchema,
  rescheduleBookingSchema,
  updateBookingStatusSchema,
  updateClientNotesSchema,
} from "@/lib/validations/bookings";

export type ActionState = {
  error?: string;
  success?: string;
};

const REVALIDATE_PATHS = ["/calendar", "/dashboard", "/clients"];

function revalidateBookings() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function upsertClient(
  supabase: Awaited<ReturnType<typeof requireOwnerContext>>["supabase"],
  businessId: string,
  name: string,
  email: string | null,
  phone: string | null
): Promise<string> {
  if (email) {
    const { data: existing } = await supabase
      .from("book_clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("book_clients")
        .update({
          full_name: name,
          phone: phone ?? undefined,
        })
        .eq("id", existing.id);
      return existing.id;
    }

    const { data, error } = await supabase
      .from("book_clients")
      .insert({
        business_id: businessId,
        full_name: name,
        email,
        phone,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  if (phone) {
    const { data: existing } = await supabase
      .from("book_clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("book_clients")
        .update({ full_name: name })
        .eq("id", existing.id);
      return existing.id;
    }

    const { data, error } = await supabase
      .from("book_clients")
      .insert({
        business_id: businessId,
        full_name: name,
        phone,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  }

  const { data, error } = await supabase
    .from("book_clients")
    .insert({
      business_id: businessId,
      full_name: name,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function getServiceDetails(
  supabase: Awaited<ReturnType<typeof requireOwnerContext>>["supabase"],
  businessId: string,
  serviceId: string,
  employeeId: string
) {
  const { data: service, error: serviceError } = await supabase
    .from("book_services")
    .select("duration_minutes, buffer_minutes, price")
    .eq("business_id", businessId)
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError || !service) {
    return null;
  }

  const { data: assignment } = await supabase
    .from("book_employee_services")
    .select("duration_override_minutes, price_override")
    .eq("employee_id", employeeId)
    .eq("service_id", serviceId)
    .maybeSingle();

  const duration =
    assignment?.duration_override_minutes ?? service.duration_minutes;
  const price = assignment?.price_override ?? service.price;

  return {
    duration,
    buffer: service.buffer_minutes,
    price: Number(price),
  };
}

export async function updateBookingStatus(
  input: unknown
): Promise<ActionState> {
  const parsed = updateBookingStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();
  const booking = await getBookingById(
    supabase,
    business.id,
    parsed.data.bookingId
  );

  if (!booking) {
    return { error: "Booking not found" };
  }

  const { error } = await supabase
    .from("book_bookings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.bookingId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  if (
    parsed.data.status === "cancelled" &&
    isActiveBookingStatus(booking.status) &&
    booking.client.email
  ) {
    await sendBookingUpdateEmail({
      businessName: business.name,
      serviceName: booking.service.name,
      employeeName: booking.employee.full_name,
      startsAt: booking.starts_at,
      timezone: business.timezone,
      currency: business.currency,
      price: Number(booking.price),
      clientName: booking.client.full_name,
      clientEmail: booking.client.email,
      manageToken: booking.manage_token,
      changeType: "cancelled",
    });
  }

  revalidateBookings();
  return { success: "Booking updated" };
}

export async function rescheduleOwnerBooking(
  input: unknown
): Promise<ActionState> {
  const parsed = rescheduleBookingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();
  const booking = await getBookingById(
    supabase,
    business.id,
    parsed.data.bookingId
  );

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (!isActiveBookingStatus(booking.status)) {
    return { error: "Only active bookings can be rescheduled" };
  }

  const duration = bookingDurationMinutes(booking.starts_at, booking.ends_at);
  const endsAt = computeRescheduleEndsAt(parsed.data.startsAt, duration);
  const previousStartsAt = booking.starts_at;

  const { error } = await supabase
    .from("book_bookings")
    .update({
      starts_at: parsed.data.startsAt,
      ends_at: endsAt,
      reminder_sent_at: null,
    })
    .eq("id", parsed.data.bookingId)
    .eq("business_id", business.id);

  if (error) {
    if (isBookingConflict(error)) {
      return { error: "This time slot is already taken" };
    }
    return { error: error.message };
  }

  if (booking.client.email) {
    await sendBookingUpdateEmail({
      businessName: business.name,
      serviceName: booking.service.name,
      employeeName: booking.employee.full_name,
      startsAt: parsed.data.startsAt,
      timezone: business.timezone,
      currency: business.currency,
      price: Number(booking.price),
      clientName: booking.client.full_name,
      clientEmail: booking.client.email,
      manageToken: booking.manage_token,
      changeType: "rescheduled",
      previousStartsAt,
    });
  }

  revalidateBookings();
  return { success: "Booking rescheduled" };
}

export async function createManualBooking(
  input: unknown
): Promise<ActionState & { bookingId?: string }> {
  const parsed = manualBookingSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();
  const details = await getServiceDetails(
    supabase,
    business.id,
    parsed.data.serviceId,
    parsed.data.employeeId
  );

  if (!details) {
    return { error: "Service or staff assignment not found" };
  }

  const email = parsed.data.clientEmail?.trim() || null;
  const phone = parsed.data.clientPhone.trim();

  let clientId: string;
  try {
    clientId = await upsertClient(
      supabase,
      business.id,
      parsed.data.clientName,
      email,
      phone
    );
  } catch {
    return { error: "Could not save client details" };
  }

  const endsAt = computeRescheduleEndsAt(
    parsed.data.startsAt,
    details.duration
  );

  const { data: businessSettings } = await supabase
    .from("book_businesses")
    .select("confirmation_mode")
    .eq("id", business.id)
    .single();

  const status =
    businessSettings?.confirmation_mode === "auto" ? "confirmed" : "pending";

  const manageToken = Buffer.from(crypto.getRandomValues(new Uint8Array(24)))
    .toString("base64url");

  const { data, error } = await supabase
    .from("book_bookings")
    .insert({
    business_id: business.id,
    employee_id: parsed.data.employeeId,
    service_id: parsed.data.serviceId,
    client_id: clientId,
    status,
    starts_at: parsed.data.startsAt,
    ends_at: endsAt,
    buffer_minutes: details.buffer,
    price: details.price,
    manage_token: manageToken,
    source: "manual",
  }).select("id").single();

  if (error) {
    if (isBookingConflict(error)) {
      return { error: "This time slot is already taken" };
    }
    return { error: error.message };
  }

  revalidateBookings();
  return { success: "Booking created", bookingId: data.id };
}

export async function updateClientNotes(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateClientNotesSchema.safeParse({
    clientId: formData.get("clientId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_clients")
    .update({ notes: parsed.data.notes ?? null })
    .eq("id", parsed.data.clientId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clients");
  return { success: "Notes saved" };
}

export async function fetchManualBookingSlots(input: {
  serviceId: string;
  employeeId: string;
  date: string;
}): Promise<
  | { ok: true; slots: Array<{ startsAt: string }> }
  | { ok: false; error: string }
> {
  const { supabase, business } = await requireOwnerContext();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Invalid date" };
  }

  const [{ data: service }, { data: employee }] = await Promise.all([
    supabase
      .from("book_services")
      .select("id")
      .eq("business_id", business.id)
      .eq("id", input.serviceId)
      .maybeSingle(),
    supabase
      .from("book_employees")
      .select("id")
      .eq("business_id", business.id)
      .eq("id", input.employeeId)
      .maybeSingle(),
  ]);

  if (!service || !employee) {
    return { ok: false, error: "Invalid service or staff member" };
  }

  try {
    const slots = await getAvailableSlots({
      businessId: business.id,
      serviceId: input.serviceId,
      date: input.date,
      employeeId: input.employeeId,
      employeeIds: [input.employeeId],
    });

    return {
      ok: true,
      slots: slots.map((slot) => ({ startsAt: slot.startsAt })),
    };
  } catch {
    return { ok: false, error: "Could not load available times" };
  }
}

export async function fetchOwnerRescheduleSlots(input: {
  bookingId: string;
  date: string;
}): Promise<
  | { ok: true; slots: Array<{ startsAt: string }> }
  | { ok: false; error: string }
> {
  const { supabase, business } = await requireOwnerContext();
  const booking = await getBookingById(supabase, business.id, input.bookingId);

  if (!booking) {
    return { ok: false, error: "Booking not found" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Invalid date" };
  }

  try {
    const slots = await getAvailableSlots({
      businessId: business.id,
      serviceId: booking.service_id,
      date: input.date,
      employeeId: booking.employee_id,
      employeeIds: [booking.employee_id],
      excludeBookingId: booking.id,
    });

    return {
      ok: true,
      slots: slots.map((slot) => ({ startsAt: slot.startsAt })),
    };
  } catch {
    return { ok: false, error: "Could not load available times" };
  }
}

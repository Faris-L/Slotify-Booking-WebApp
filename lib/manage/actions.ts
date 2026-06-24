"use server";

import { revalidatePath } from "next/cache";

import { sendBookingUpdateEmail } from "@/lib/email";
import { getAvailableSlots } from "@/lib/booking/slots";
import {
  bookingDurationMinutes,
  canClientModifyBooking,
  computeRescheduleEndsAt,
  isActiveBookingStatus,
  isBookingConflict,
} from "@/lib/bookings/utils";
import { getBookingByManageToken } from "@/lib/manage/queries";
import {
  manageCancelSchema,
  manageFetchSlotsSchema,
  manageRescheduleSchema,
} from "@/lib/validations/manage";
import { enforceRateLimit } from "@/lib/rate-limit/guard";
import { RATE_LIMITS } from "@/lib/rate-limit/index";
import { createAdminClient } from "@/utils/supabase/admin";

export type ManageActionState = {
  error?: string;
  success?: string;
};

function revalidateManage(token: string) {
  revalidatePath(`/manage/${token}`);
}

export async function fetchManageSlots(
  input: unknown
): Promise<
  | { ok: true; slots: Array<{ startsAt: string }> }
  | { ok: false; error: string }
> {
  const parsed = manageFetchSlotsSchema.safeParse(input);

  if (parsed.success) {
    const rateLimitError = await enforceRateLimit(
      "manage:slots",
      RATE_LIMITS.manageSlots,
      parsed.data.manageToken
    );

    if (rateLimitError) {
      return { ok: false, error: rateLimitError };
    }
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const booking = await getBookingByManageToken(parsed.data.manageToken);

  if (!booking) {
    return { ok: false, error: "Booking not found" };
  }

  if (!isActiveBookingStatus(booking.status)) {
    return { ok: false, error: "This booking can no longer be changed" };
  }

  if (
    !canClientModifyBooking(
      booking.starts_at,
      booking.business.cancel_cutoff_hours
    )
  ) {
    return {
      ok: false,
      error: "Changes are no longer allowed for this booking",
    };
  }

  try {
    const slots = await getAvailableSlots({
      businessId: booking.business.id,
      serviceId: booking.service_id,
      date: parsed.data.date,
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

export async function cancelBookingByToken(
  input: unknown
): Promise<ManageActionState> {
  const parsed = manageCancelSchema.safeParse(input);

  if (parsed.success) {
    const rateLimitError = await enforceRateLimit(
      "manage:cancel",
      RATE_LIMITS.manageAction,
      parsed.data.manageToken
    );

    if (rateLimitError) {
      return { error: rateLimitError };
    }
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const booking = await getBookingByManageToken(parsed.data.manageToken);

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (!isActiveBookingStatus(booking.status)) {
    return { error: "This booking is already closed" };
  }

  if (
    !canClientModifyBooking(
      booking.starts_at,
      booking.business.cancel_cutoff_hours
    )
  ) {
    return {
      error: `Cancellations must be made at least ${booking.business.cancel_cutoff_hours} hours before the appointment`,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("book_bookings")
    .update({ status: "cancelled" })
    .eq("manage_token", parsed.data.manageToken);

  if (error) {
    return { error: "Could not cancel booking. Please try again." };
  }

  if (booking.client.email) {
    await sendBookingUpdateEmail({
      businessName: booking.business.name,
      serviceName: booking.service.name,
      employeeName: booking.employee.full_name,
      startsAt: booking.starts_at,
      timezone: booking.business.timezone,
      currency: booking.business.currency,
      price: Number(booking.price),
      clientName: booking.client.full_name,
      clientEmail: booking.client.email,
      manageToken: booking.manage_token,
      changeType: "cancelled",
    });
  }

  revalidateManage(parsed.data.manageToken);
  return { success: "Booking cancelled" };
}

export async function rescheduleBookingByToken(
  input: unknown
): Promise<ManageActionState> {
  const parsed = manageRescheduleSchema.safeParse(input);

  if (parsed.success) {
    const rateLimitError = await enforceRateLimit(
      "manage:reschedule",
      RATE_LIMITS.manageAction,
      parsed.data.manageToken
    );

    if (rateLimitError) {
      return { error: rateLimitError };
    }
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const booking = await getBookingByManageToken(parsed.data.manageToken);

  if (!booking) {
    return { error: "Booking not found" };
  }

  if (!isActiveBookingStatus(booking.status)) {
    return { error: "This booking can no longer be changed" };
  }

  if (
    !canClientModifyBooking(
      booking.starts_at,
      booking.business.cancel_cutoff_hours
    )
  ) {
    return {
      error: `Changes must be made at least ${booking.business.cancel_cutoff_hours} hours before the appointment`,
    };
  }

  const duration = bookingDurationMinutes(booking.starts_at, booking.ends_at);
  const endsAt = computeRescheduleEndsAt(parsed.data.startsAt, duration);
  const previousStartsAt = booking.starts_at;
  const admin = createAdminClient();

  const { error } = await admin
    .from("book_bookings")
    .update({
      starts_at: parsed.data.startsAt,
      ends_at: endsAt,
      reminder_sent_at: null,
    })
    .eq("manage_token", parsed.data.manageToken);

  if (error) {
    if (isBookingConflict(error)) {
      return {
        error: "This time was just taken. Please pick another slot.",
      };
    }
    return { error: "Could not reschedule. Please try again." };
  }

  if (booking.client.email) {
    await sendBookingUpdateEmail({
      businessName: booking.business.name,
      serviceName: booking.service.name,
      employeeName: booking.employee.full_name,
      startsAt: parsed.data.startsAt,
      timezone: booking.business.timezone,
      currency: booking.business.currency,
      price: Number(booking.price),
      clientName: booking.client.full_name,
      clientEmail: booking.client.email,
      manageToken: booking.manage_token,
      changeType: "rescheduled",
      previousStartsAt,
    });
  }

  revalidateManage(parsed.data.manageToken);
  return { success: "Booking rescheduled" };
}

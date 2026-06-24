import type { PostgrestError } from "@supabase/supabase-js";

import type { BookingStatus } from "@/lib/bookings/types";

export function isBookingConflict(error: PostgrestError | null): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "23P01" ||
    error.message.includes("book_no_overlap") ||
    error.message.includes("exclusion")
  );
}

export function canClientModifyBooking(
  startsAt: string,
  cancelCutoffHours: number
): boolean {
  const cutoffMs = cancelCutoffHours * 60 * 60 * 1000;
  return new Date(startsAt).getTime() - Date.now() >= cutoffMs;
}

export function isActiveBookingStatus(status: BookingStatus): boolean {
  return status === "pending" || status === "confirmed";
}

export function bookingDurationMinutes(
  startsAt: string,
  endsAt: string
): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000
  );
}

export function computeRescheduleEndsAt(
  startsAt: string,
  durationMinutes: number
): string {
  return new Date(
    new Date(startsAt).getTime() + durationMinutes * 60_000
  ).toISOString();
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

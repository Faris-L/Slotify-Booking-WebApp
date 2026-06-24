import {
  sendBookingReminderEmail,
  type BookingReminderEmailDetails,
} from "@/lib/email";
import { createAdminClient } from "@/utils/supabase/admin";

export const REMINDER_WINDOW_HOURS = 24;
export const REMINDER_WINDOW_TOLERANCE_HOURS = 1;

export type ReminderWindow = {
  start: Date;
  end: Date;
};

export function computeReminderWindow(
  now: Date,
  hoursAhead = REMINDER_WINDOW_HOURS,
  toleranceHours = REMINDER_WINDOW_TOLERANCE_HOURS
): ReminderWindow {
  const halfToleranceMs = (toleranceHours / 2) * 60 * 60 * 1000;
  const targetMs = hoursAhead * 60 * 60 * 1000;

  return {
    start: new Date(now.getTime() + targetMs - halfToleranceMs),
    end: new Date(now.getTime() + targetMs + halfToleranceMs),
  };
}

type ReminderBookingRow = {
  id: string;
  starts_at: string;
  manage_token: string;
  price: number;
  business: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
  };
  service: {
    name: string;
  };
  employee: {
    full_name: string;
  };
  client: {
    full_name: string;
    email: string | null;
  };
};

function mapReminderRow(row: Record<string, unknown>): ReminderBookingRow {
  return row as unknown as ReminderBookingRow;
}

export type ProcessRemindersResult = {
  scanned: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

async function claimReminderSlot(bookingId: string): Promise<boolean> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("book_bookings")
    .update({ reminder_sent_at: now })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[cron/reminders] Failed to claim booking:", bookingId, error);
    return false;
  }

  return data != null;
}

async function sendReminderForBooking(
  booking: ReminderBookingRow
): Promise<{ sent: boolean; error?: string }> {
  if (!booking.client.email) {
    return { sent: false, error: "No client email" };
  }

  const details: BookingReminderEmailDetails & { clientEmail: string } = {
    businessName: booking.business.name,
    serviceName: booking.service.name,
    employeeName: booking.employee.full_name,
    startsAt: booking.starts_at,
    timezone: booking.business.timezone,
    clientName: booking.client.full_name,
    manageToken: booking.manage_token,
    clientEmail: booking.client.email,
  };

  return sendBookingReminderEmail(details);
}

export async function processReminders(
  now = new Date()
): Promise<ProcessRemindersResult> {
  const admin = createAdminClient();
  const window = computeReminderWindow(now);

  const { data: bookings, error } = await admin
    .from("book_bookings")
    .select(
      `
      id,
      starts_at,
      manage_token,
      price,
      business:book_businesses!book_bookings_business_id_fkey(id, name, timezone, currency),
      service:book_services!book_bookings_service_id_fkey(name),
      employee:book_employees!book_bookings_employee_id_fkey(full_name),
      client:book_clients!book_bookings_client_id_fkey(full_name, email)
    `
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", window.start.toISOString())
    .lt("starts_at", window.end.toISOString());

  if (error) {
    console.error("[cron/reminders] Query failed:", error);
    throw new Error(error.message);
  }

  const rows = (bookings ?? []).map((row) =>
    mapReminderRow(row as Record<string, unknown>)
  );
  const result: ProcessRemindersResult = {
    scanned: rows.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const booking of rows) {
    if (!booking.client.email) {
      result.skipped += 1;
      continue;
    }

    const claimed = await claimReminderSlot(booking.id);

    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    const emailResult = await sendReminderForBooking(booking);

    if (emailResult.sent) {
      result.sent += 1;
    } else {
      result.failed += 1;
      if (emailResult.error) {
        result.errors.push(`${booking.id}: ${emailResult.error}`);
      }

      await admin
        .from("book_bookings")
        .update({ reminder_sent_at: null })
        .eq("id", booking.id);
    }
  }

  return result;
}

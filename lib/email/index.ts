import { sendEmail } from "@/lib/email/core";
import {
  buildConfirmationEmailHtml,
  buildOwnerNotificationEmailHtml,
  buildReminderEmailHtml,
  buildUpdateEmailHtml,
  type BookingEmailDetails,
  type BookingReminderEmailDetails,
  type BookingUpdateEmailDetails,
  type OwnerBookingNotificationDetails,
} from "@/lib/email/templates";

export type {
  BookingEmailDetails,
  BookingReminderEmailDetails,
  BookingUpdateEmailDetails,
  OwnerBookingNotificationDetails,
};

export async function sendBookingConfirmationEmail(
  details: BookingEmailDetails & { clientEmail: string }
): Promise<{ sent: boolean; error?: string }> {
  const subject =
    details.status === "confirmed"
      ? `Confirmed: ${details.serviceName} at ${details.businessName}`
      : `Request received: ${details.serviceName} at ${details.businessName}`;

  return sendEmail(
    details.clientEmail,
    subject,
    buildConfirmationEmailHtml(details)
  );
}

export async function sendBookingUpdateEmail(
  details: BookingUpdateEmailDetails & { clientEmail: string }
): Promise<{ sent: boolean; error?: string }> {
  if (!details.clientEmail) {
    return { sent: false, error: "No client email" };
  }

  const subject =
    details.changeType === "cancelled"
      ? `Cancelled: ${details.serviceName} at ${details.businessName}`
      : `Rescheduled: ${details.serviceName} at ${details.businessName}`;

  return sendEmail(
    details.clientEmail,
    subject,
    buildUpdateEmailHtml(details)
  );
}

export async function sendBookingReminderEmail(
  details: BookingReminderEmailDetails & { clientEmail: string }
): Promise<{ sent: boolean; error?: string }> {
  const dateLabel = new Date(details.startsAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return sendEmail(
    details.clientEmail,
    `Reminder: ${details.serviceName} on ${dateLabel}`,
    buildReminderEmailHtml(details)
  );
}

export async function sendOwnerBookingNotificationEmail(
  details: OwnerBookingNotificationDetails & { ownerEmail: string }
): Promise<{ sent: boolean; error?: string }> {
  const subject =
    details.status === "pending"
      ? `New request: ${details.serviceName} — ${details.clientName}`
      : `New booking: ${details.serviceName} — ${details.clientName}`;

  return sendEmail(
    details.ownerEmail,
    subject,
    buildOwnerNotificationEmailHtml(details)
  );
}

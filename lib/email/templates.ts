import {
  formatBookingDate,
  formatPrice,
  formatSlotTime,
} from "@/lib/booking/format";
import { getAppUrl } from "@/lib/email/core";

const emailStyles = {
  wrapper:
    "font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;",
  heading: "font-size: 20px; margin-bottom: 8px;",
  card: "background: #f0f9ff; border-radius: 12px; padding: 16px; margin-bottom: 16px;",
  cardDanger: "background: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 16px;",
  button:
    "display: inline-block; background: #0ea5e9; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;",
  muted: "font-size: 12px; color: #64748b; margin: 0;",
};

export type BookingEmailDetails = {
  businessName: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  timezone: string;
  currency: string;
  price: number;
  status: "pending" | "confirmed";
  clientName: string;
  manageToken: string;
};

export type BookingUpdateEmailDetails = {
  businessName: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  timezone: string;
  currency: string;
  price: number;
  clientName: string;
  manageToken: string;
  changeType: "rescheduled" | "cancelled";
  previousStartsAt?: string;
};

export type BookingReminderEmailDetails = {
  businessName: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  timezone: string;
  clientName: string;
  manageToken: string;
};

export type OwnerBookingNotificationDetails = {
  businessName: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  timezone: string;
  price: number;
  currency: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: "pending" | "confirmed";
  source: string;
};

function bookingDetailsBlock(details: {
  businessName: string;
  serviceName: string;
  employeeName: string;
  startsAt: string;
  timezone: string;
  price?: number;
  currency?: string;
}): string {
  const dateLabel = formatBookingDate(details.startsAt, details.timezone);
  const timeLabel = formatSlotTime(details.startsAt, details.timezone);
  const priceLine =
    details.price != null && details.currency
      ? `<p style="margin: 0;">${formatPrice(details.price, details.currency)}</p>`
      : "";

  return `
    <div style="${emailStyles.card}">
      <p style="margin: 0 0 8px;"><strong>${details.businessName}</strong></p>
      <p style="margin: 0 0 4px;">${details.serviceName} with ${details.employeeName}</p>
      <p style="margin: 0 0 4px;">${dateLabel}</p>
      <p style="margin: 0 0 4px;">${timeLabel}</p>
      ${priceLine}
    </div>
  `;
}

export function buildConfirmationEmailHtml(details: BookingEmailDetails): string {
  const manageUrl = `${getAppUrl()}/manage/${details.manageToken}`;
  const statusMessage =
    details.status === "confirmed"
      ? "Your appointment is confirmed."
      : "Your request was received and is awaiting confirmation from the business.";
  const title =
    details.status === "confirmed" ? "Booking confirmed" : "Booking received";

  return `
    <div style="${emailStyles.wrapper}">
      <h1 style="${emailStyles.heading}">${title}</h1>
      <p style="margin: 0 0 16px;">Hi ${details.clientName},</p>
      <p style="margin: 0 0 16px;">${statusMessage}</p>
      ${bookingDetailsBlock(details)}
      <p style="margin: 0 0 16px;">Manage or cancel your booking using the secure link below:</p>
      <p style="margin: 0 0 24px;">
        <a href="${manageUrl}" style="${emailStyles.button}">Manage booking</a>
      </p>
      <p style="${emailStyles.muted}">If the button does not work, copy this link: ${manageUrl}</p>
    </div>
  `;
}

export function buildUpdateEmailHtml(details: BookingUpdateEmailDetails): string {
  const manageUrl = `${getAppUrl()}/manage/${details.manageToken}`;

  if (details.changeType === "cancelled") {
    const dateLabel = formatBookingDate(details.startsAt, details.timezone);
    const timeLabel = formatSlotTime(details.startsAt, details.timezone);

    return `
      <div style="${emailStyles.wrapper}">
        <h1 style="${emailStyles.heading}">Booking cancelled</h1>
        <p style="margin: 0 0 16px;">Hi ${details.clientName},</p>
        <p style="margin: 0 0 16px;">Your appointment at <strong>${details.businessName}</strong> has been cancelled.</p>
        <div style="${emailStyles.cardDanger}">
          <p style="margin: 0 0 4px;">${details.serviceName} with ${details.employeeName}</p>
          <p style="margin: 0 0 4px;">${dateLabel}</p>
          <p style="margin: 0;">${timeLabel}</p>
        </div>
        <p style="${emailStyles.muted}">Need a new appointment? Visit ${getAppUrl()}</p>
      </div>
    `;
  }

  const previousLabel =
    details.previousStartsAt != null
      ? `${formatBookingDate(details.previousStartsAt, details.timezone)} at ${formatSlotTime(details.previousStartsAt, details.timezone)}`
      : null;

  return `
    <div style="${emailStyles.wrapper}">
      <h1 style="${emailStyles.heading}">Booking rescheduled</h1>
      <p style="margin: 0 0 16px;">Hi ${details.clientName},</p>
      <p style="margin: 0 0 16px;">Your appointment at <strong>${details.businessName}</strong> has a new time.</p>
      ${previousLabel ? `<p style="margin: 0 0 12px; color: #64748b;">Previous: ${previousLabel}</p>` : ""}
      ${bookingDetailsBlock(details)}
      <p style="margin: 0 0 16px;">Manage your booking:</p>
      <p style="margin: 0 0 24px;">
        <a href="${manageUrl}" style="${emailStyles.button}">Manage booking</a>
      </p>
    </div>
  `;
}

export function buildReminderEmailHtml(
  details: BookingReminderEmailDetails
): string {
  const manageUrl = `${getAppUrl()}/manage/${details.manageToken}`;
  const dateLabel = formatBookingDate(details.startsAt, details.timezone);
  const timeLabel = formatSlotTime(details.startsAt, details.timezone);

  return `
    <div style="${emailStyles.wrapper}">
      <h1 style="${emailStyles.heading}">Reminder: appointment tomorrow</h1>
      <p style="margin: 0 0 16px;">Hi ${details.clientName},</p>
      <p style="margin: 0 0 16px;">This is a friendly reminder about your upcoming appointment at <strong>${details.businessName}</strong>.</p>
      <div style="${emailStyles.card}">
        <p style="margin: 0 0 4px;">${details.serviceName} with ${details.employeeName}</p>
        <p style="margin: 0 0 4px;">${dateLabel}</p>
        <p style="margin: 0;">${timeLabel}</p>
      </div>
      <p style="margin: 0 0 16px;">Need to reschedule or cancel?</p>
      <p style="margin: 0 0 24px;">
        <a href="${manageUrl}" style="${emailStyles.button}">Manage booking</a>
      </p>
      <p style="${emailStyles.muted}">If the button does not work, copy this link: ${manageUrl}</p>
    </div>
  `;
}

export function buildOwnerNotificationEmailHtml(
  details: OwnerBookingNotificationDetails
): string {
  const calendarUrl = `${getAppUrl()}/calendar`;
  const dateLabel = formatBookingDate(details.startsAt, details.timezone);
  const timeLabel = formatSlotTime(details.startsAt, details.timezone);
  const priceLabel = formatPrice(details.price, details.currency);
  const statusLabel =
    details.status === "confirmed"
      ? "Confirmed"
      : "Pending your approval";
  const sourceLabel =
    details.source === "manual" ? "Manual (walk-in/phone)" : "Online booking";

  return `
    <div style="${emailStyles.wrapper}">
      <h1 style="${emailStyles.heading}">New booking at ${details.businessName}</h1>
      <p style="margin: 0 0 16px;">You have a new ${details.status === "pending" ? "booking request" : "confirmed booking"}.</p>
      <div style="${emailStyles.card}">
        <p style="margin: 0 0 8px;"><strong>${details.serviceName}</strong> with ${details.employeeName}</p>
        <p style="margin: 0 0 4px;">${dateLabel} at ${timeLabel}</p>
        <p style="margin: 0 0 4px;">${priceLabel}</p>
        <p style="margin: 0 0 4px;">Status: ${statusLabel}</p>
        <p style="margin: 0;">Source: ${sourceLabel}</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 4px;"><strong>${details.clientName}</strong></p>
        <p style="margin: 0 0 4px;">${details.clientEmail}</p>
        <p style="margin: 0;">${details.clientPhone}</p>
      </div>
      <p style="margin: 0 0 24px;">
        <a href="${calendarUrl}" style="${emailStyles.button}">Open calendar</a>
      </p>
    </div>
  `;
}

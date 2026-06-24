import { formatInTimeZone } from "date-fns-tz";

export function formatSlotTime(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, "h:mm a");
}

export function formatBookingDate(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, "EEEE, MMM d, yyyy");
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
}

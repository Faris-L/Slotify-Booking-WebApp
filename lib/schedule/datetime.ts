import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const DATETIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";
const DISPLAY_FORMAT = "MMM d, yyyy · HH:mm";

/** Convert UTC ISO from DB to `datetime-local` value in business timezone. */
export function toDatetimeLocalValue(iso: string, timezone: string): string {
  return formatInTimeZone(new Date(iso), timezone, DATETIME_LOCAL_FORMAT);
}

/** Convert `datetime-local` form value (business timezone) to UTC ISO for DB. */
export function fromDatetimeLocalValue(value: string, timezone: string): string {
  return fromZonedTime(value, timezone).toISOString();
}

export function formatTimeOffRange(
  startsAt: string,
  endsAt: string,
  timezone: string
): string {
  const start = formatInTimeZone(new Date(startsAt), timezone, DISPLAY_FORMAT);
  const end = formatInTimeZone(new Date(endsAt), timezone, DISPLAY_FORMAT);
  return `${start} – ${end}`;
}

export function isUpcoming(startsAt: string): boolean {
  return new Date(startsAt) >= new Date();
}

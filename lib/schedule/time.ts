/** Normalize Postgres `time` or HTML time input to HH:MM for `<input type="time">`. */
export function toTimeInputValue(value: string): string {
  return value.slice(0, 5);
}

/** Normalize HTML time input to Postgres `time` (HH:MM:SS). */
export function toDbTimeValue(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export function formatHoursRange(
  openTime: string,
  closeTime: string,
  isClosed: boolean
): string {
  if (isClosed) {
    return "Closed";
  }

  return `${toTimeInputValue(openTime)} – ${toTimeInputValue(closeTime)}`;
}

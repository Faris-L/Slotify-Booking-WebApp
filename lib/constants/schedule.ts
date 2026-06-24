/** 0 = Sunday … 6 = Saturday (matches DB.md) */
export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const DEFAULT_OPEN_TIME = "09:00:00";
export const DEFAULT_CLOSE_TIME = "17:00:00";

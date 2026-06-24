export const CONFIRMATION_MODES = [
  {
    value: "auto",
    label: "Automatic",
    description: "New online bookings are confirmed immediately.",
  },
  {
    value: "manual",
    label: "Manual review",
    description: "New bookings stay pending until you confirm them.",
  },
] as const;

export type ConfirmationMode = (typeof CONFIRMATION_MODES)[number]["value"];

export const DEFAULT_MIN_LEAD_MINUTES = 120;
export const DEFAULT_CANCEL_CUTOFF_HOURS = 24;

export const BUSINESS_TIMEZONES = [
  { value: "Europe/Sarajevo", label: "Europe/Sarajevo (CET)" },
  { value: "Europe/Belgrade", label: "Europe/Belgrade (CET)" },
  { value: "Europe/Zagreb", label: "Europe/Zagreb (CET)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "America/New_York", label: "America/New York (ET)" },
  { value: "UTC", label: "UTC" },
] as const;

export const BUSINESS_CURRENCIES = [
  { value: "BAM", label: "BAM — Konvertibilna marka" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
] as const;

export const DEFAULT_TIMEZONE = "Europe/Sarajevo";
export const DEFAULT_CURRENCY = "BAM";
export const DEFAULT_BRAND_COLOR = "#0ea5e9";

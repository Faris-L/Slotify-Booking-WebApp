export const TIME_OFF_TYPES = [
  {
    value: "holiday",
    label: "Holiday",
    description: "Business-wide closure (e.g. public holiday)",
  },
  {
    value: "block",
    label: "Block",
    description: "Unavailable period (meeting, maintenance, etc.)",
  },
  {
    value: "break",
    label: "Break",
    description: "Scheduled break (lunch, pause between clients)",
  },
] as const;

export type TimeOffType = (typeof TIME_OFF_TYPES)[number]["value"];
export type TimeOffScope = "business" | "employee";

export function getTimeOffTypeLabel(type: TimeOffType): string {
  return TIME_OFF_TYPES.find((item) => item.value === type)?.label ?? type;
}

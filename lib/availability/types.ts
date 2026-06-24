import type {
  BusinessHoursRow,
  EmployeeHoursRow,
} from "@/lib/schedule/queries";

export type TimeInterval = {
  start: Date;
  end: Date;
};

export type AvailabilityBooking = {
  starts_at: string;
  ends_at: string;
  buffer_minutes: number;
  status: string;
};

export type AvailabilityTimeOff = {
  scope: "business" | "employee";
  type: "holiday" | "block" | "break";
  starts_at: string;
  ends_at: string;
  employee_id: string | null;
};

export type AvailabilityService = {
  duration_minutes: number;
  buffer_minutes: number;
};

export type AvailabilityBusiness = {
  timezone: string;
  min_lead_minutes: number;
  max_horizon_days: number;
};

export type AvailabilityInput = {
  /** Calendar date in business timezone (YYYY-MM-DD). */
  date: string;
  business: AvailabilityBusiness;
  businessHours: BusinessHoursRow[];
  employeeHours: EmployeeHoursRow[];
  service: AvailabilityService;
  durationOverrideMinutes: number | null;
  timeOff: AvailabilityTimeOff[];
  bookings: AvailabilityBooking[];
  /** Reference "now" for lead-time checks (defaults to current time in tests). */
  now?: Date;
};

export type FreeSlot = {
  /** Slot start as UTC ISO string (timestamptz-ready). */
  startsAt: string;
};

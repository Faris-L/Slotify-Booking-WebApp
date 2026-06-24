import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const updateBookingStatusSchema = z.object({
  bookingId: z.uuid("Invalid booking"),
  status: bookingStatusSchema,
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.uuid("Invalid booking"),
  startsAt: z.string().min(1, "Start time is required"),
});

export const manualBookingSchema = z.object({
  serviceId: z.uuid("Select a service"),
  employeeId: z.uuid("Select a staff member"),
  startsAt: z.string().min(1, "Start time is required"),
  clientName: z.string().trim().min(1, "Name is required").max(120),
  clientEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.union([z.email("Enter a valid email"), z.undefined()])),
  clientPhone: z
    .string()
    .trim()
    .min(5, "Phone number is required")
    .max(30, "Phone number is too long"),
});

export const updateClientNotesSchema = z.object({
  clientId: z.uuid("Invalid client"),
  notes: z.string().max(2000).optional(),
});

export type ManualBookingInput = z.infer<typeof manualBookingSchema>;

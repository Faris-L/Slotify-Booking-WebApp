import { z } from "zod";

export const fetchSlotsSchema = z.object({
  businessId: z.uuid("Invalid business"),
  serviceId: z.uuid("Invalid service"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  employeeId: z
    .union([z.uuid("Invalid staff member"), z.literal("any")])
    .optional(),
});

export const createBookingSchema = z.object({
  businessId: z.uuid("Invalid business"),
  serviceId: z.uuid("Invalid service"),
  employeeId: z.uuid("Invalid staff member"),
  startsAt: z.string().min(1, "Start time is required"),
  clientName: z.string().trim().min(1, "Name is required").max(120),
  clientEmail: z.email("Enter a valid email address"),
  clientPhone: z
    .string()
    .trim()
    .min(5, "Phone number is required")
    .max(30, "Phone number is too long"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

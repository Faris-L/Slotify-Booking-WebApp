import { z } from "zod";

export const employeeSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  email: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? null : String(val).trim(),
    z.union([z.null(), z.string().email("Enter a valid email").max(254)])
  ),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.literal("on")])
    .optional()
    .transform((value) => value === "true" || value === "on"),
});

const optionalPriceOverride = z.preprocess(
  (val) =>
    val === "" || val === null || val === undefined ? null : Number(val),
  z
    .union([z.null(), z.number()])
    .refine((value) => value === null || value >= 0, {
      message: "Value cannot be negative",
    })
);

const optionalDurationOverride = z.preprocess(
  (val) =>
    val === "" || val === null || val === undefined
      ? null
      : Number.parseInt(String(val), 10),
  z
    .union([z.null(), z.number().int()])
    .refine(
      (value) => value === null || (value >= 5 && value <= 480),
      { message: "Duration override must be between 5 and 480 minutes" }
    )
);

export const employeeServiceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee"),
  serviceId: z.string().uuid("Select a service"),
  priceOverride: optionalPriceOverride,
  durationOverrideMinutes: optionalDurationOverride,
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeServiceInput = z.infer<typeof employeeServiceSchema>;

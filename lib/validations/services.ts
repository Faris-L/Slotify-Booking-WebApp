import { z } from "zod";

export const serviceCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(60, "Category name is too long"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Service name is required")
    .max(100, "Service name is too long"),
  description: z
    .string()
    .trim()
    .max(500, "Description is too long")
    .optional()
    .transform((value) => value || null),
  categoryId: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(z.string().uuid().nullable()),
  durationMinutes: z.coerce
    .number()
    .int("Duration must be a whole number")
    .min(5, "Minimum duration is 5 minutes")
    .max(480, "Maximum duration is 8 hours"),
  bufferMinutes: z.coerce
    .number()
    .int("Buffer must be a whole number")
    .min(0, "Buffer cannot be negative")
    .max(120, "Maximum buffer is 120 minutes"),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(999999.99, "Price is too high"),
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.literal("on")])
    .optional()
    .transform((value) => value === "true" || value === "on"),
});

export type ServiceCategoryInput = z.infer<typeof serviceCategorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;

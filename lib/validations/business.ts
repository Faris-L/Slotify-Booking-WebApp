import { z } from "zod";

import { isValidSlug } from "@/lib/slug";

export const businessSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(80, "Business name is too long"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, {
      message:
        "Slug must be 3–48 characters, lowercase letters, numbers, and hyphens only",
    }),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().length(3, "Select a currency"),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a valid hex color"),
});

export type BusinessSetupInput = z.infer<typeof businessSetupSchema>;

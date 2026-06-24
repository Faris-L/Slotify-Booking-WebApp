import { z } from "zod";

export const businessSettingsSchema = z.object({
  confirmationMode: z.enum(["auto", "manual"]),
  minLeadMinutes: z.coerce
    .number()
    .int("Lead time must be a whole number of minutes")
    .min(0, "Lead time cannot be negative")
    .max(10_080, "Lead time cannot exceed 7 days"),
  cancelCutoffHours: z.coerce
    .number()
    .int("Cutoff must be a whole number of hours")
    .min(0, "Cutoff cannot be negative")
    .max(168, "Cutoff cannot exceed 7 days"),
  allowAnyEmployee: z.preprocess(
    (val) => val === "true" || val === "on" || val === true,
    z.boolean()
  ),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

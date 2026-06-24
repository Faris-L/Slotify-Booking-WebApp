import { z } from "zod";

export const manageRescheduleSchema = z.object({
  manageToken: z.string().min(1, "Invalid link"),
  startsAt: z.string().min(1, "Start time is required"),
});

export const manageCancelSchema = z.object({
  manageToken: z.string().min(1, "Invalid link"),
});

export const manageFetchSlotsSchema = z.object({
  manageToken: z.string().min(1, "Invalid link"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

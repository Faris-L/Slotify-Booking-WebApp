import { z } from "zod";

export const timeOffSchema = z
  .object({
    scope: z.enum(["business", "employee"]),
    employeeId: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? null : String(val),
      z.string().uuid().nullable()
    ),
    type: z.enum(["holiday", "block", "break"]),
    startsAt: z.string().trim().min(1, "Start date and time are required"),
    endsAt: z.string().trim().min(1, "End date and time are required"),
    reason: z.preprocess(
      (val) =>
        val === "" || val === null || val === undefined ? null : String(val).trim(),
      z.string().max(200, "Reason is too long").nullable()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "employee" && !data.employeeId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a staff member",
        path: ["employeeId"],
      });
    }

    if (data.endsAt <= data.startsAt) {
      ctx.addIssue({
        code: "custom",
        message: "End must be after start",
        path: ["endsAt"],
      });
    }
  });

export type TimeOffInput = z.infer<typeof timeOffSchema>;

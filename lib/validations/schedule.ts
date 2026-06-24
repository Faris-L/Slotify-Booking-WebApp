import { z } from "zod";

import { WEEKDAYS } from "@/lib/constants/schedule";

const timeValueSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter a valid time");

export const hoursDaySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    isClosed: z.preprocess(
      (val) => val === "true" || val === "on" || val === true,
      z.boolean()
    ),
    openTime: timeValueSchema,
    closeTime: timeValueSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.isClosed && data.closeTime <= data.openTime) {
      ctx.addIssue({
        code: "custom",
        message: "Close time must be after open time",
        path: ["closeTime"],
      });
    }
  });

export const businessHoursSchema = z.object({
  days: z
    .array(hoursDaySchema)
    .length(WEEKDAYS.length, "All weekdays are required"),
});

export const employeeHoursDaySchema = hoursDaySchema.extend({
  mode: z.enum(["inherit", "custom"]),
});

export const employeeHoursSchema = z.object({
  employeeId: z.string().uuid("Select a staff member"),
  days: z
    .array(employeeHoursDaySchema)
    .length(WEEKDAYS.length, "All weekdays are required"),
});

export type HoursDayInput = z.infer<typeof hoursDaySchema>;
export type EmployeeHoursDayInput = z.infer<typeof employeeHoursDaySchema>;

export function parseHoursDaysFromFormData(
  formData: FormData,
  prefix: string,
  includeMode = false
) {
  return WEEKDAYS.map(({ value: weekday }) => {
    const base = {
      weekday,
      isClosed: formData.get(`${prefix}${weekday}-closed`),
      openTime: formData.get(`${prefix}${weekday}-open`),
      closeTime: formData.get(`${prefix}${weekday}-close`),
    };

    if (!includeMode) {
      return base;
    }

    return {
      ...base,
      mode: formData.get(`${prefix}${weekday}-mode`),
    };
  });
}

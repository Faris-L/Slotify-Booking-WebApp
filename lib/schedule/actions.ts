"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerContext } from "@/lib/business/context";
import {
  buildBusinessHoursUpsertRows,
  buildEmployeeHoursUpsertRows,
} from "@/lib/schedule/queries";
import {
  businessHoursSchema,
  employeeHoursSchema,
  parseHoursDaysFromFormData,
} from "@/lib/validations/schedule";

export type ActionState = {
  error?: string;
  success?: string;
};

const SCHEDULE_PATH = "/schedule";

function revalidateSchedule() {
  revalidatePath(SCHEDULE_PATH);
  revalidatePath("/dashboard");
}

async function verifyEmployeeOwnership(
  supabase: Awaited<ReturnType<typeof requireOwnerContext>>["supabase"],
  businessId: string,
  employeeId: string
) {
  const { data } = await supabase
    .from("book_employees")
    .select("id")
    .eq("id", employeeId)
    .eq("business_id", businessId)
    .maybeSingle();

  return Boolean(data);
}

export async function updateBusinessHours(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = businessHoursSchema.safeParse({
    days: parseHoursDaysFromFormData(formData, "biz-"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const rows = buildBusinessHoursUpsertRows(
    business.id,
    parsed.data.days.map((day) => ({
      weekday: day.weekday,
      isClosed: day.isClosed,
      openTime: day.openTime,
      closeTime: day.closeTime,
    }))
  );

  const { error } = await supabase
    .from("book_business_hours")
    .upsert(rows, { onConflict: "business_id,weekday" });

  if (error) {
    return { error: error.message };
  }

  revalidateSchedule();
  return { success: "Business hours saved." };
}

export async function updateEmployeeHours(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) {
    return { error: "Staff member not found." };
  }

  const parsed = employeeHoursSchema.safeParse({
    employeeId,
    days: parseHoursDaysFromFormData(formData, `emp-${employeeId}-`, true),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const ownsEmployee = await verifyEmployeeOwnership(
    supabase,
    business.id,
    parsed.data.employeeId
  );

  if (!ownsEmployee) {
    return { error: "Staff member not found." };
  }

  const customDays = parsed.data.days.filter((day) => day.mode === "custom");
  const inheritWeekdays = parsed.data.days
    .filter((day) => day.mode === "inherit")
    .map((day) => day.weekday);

  if (inheritWeekdays.length > 0) {
    const { error: deleteError } = await supabase
      .from("book_employee_hours")
      .delete()
      .eq("business_id", business.id)
      .eq("employee_id", parsed.data.employeeId)
      .in("weekday", inheritWeekdays);

    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  if (customDays.length > 0) {
    const rows = buildEmployeeHoursUpsertRows(
      business.id,
      parsed.data.employeeId,
      customDays.map((day) => ({
        weekday: day.weekday,
        isClosed: day.isClosed,
        openTime: day.openTime,
        closeTime: day.closeTime,
      }))
    );

    const { error: upsertError } = await supabase
      .from("book_employee_hours")
      .upsert(rows, { onConflict: "employee_id,weekday" });

    if (upsertError) {
      return { error: upsertError.message };
    }
  }

  revalidateSchedule();
  return { success: "Staff schedule saved." };
}

export async function clearEmployeeHours(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) {
    return { error: "Staff member not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const ownsEmployee = await verifyEmployeeOwnership(
    supabase,
    business.id,
    employeeId
  );

  if (!ownsEmployee) {
    return { error: "Staff member not found." };
  }

  const { error } = await supabase
    .from("book_employee_hours")
    .delete()
    .eq("business_id", business.id)
    .eq("employee_id", employeeId);

  if (error) {
    return { error: error.message };
  }

  revalidateSchedule();
  return { success: "Staff member now uses business hours for all days." };
}

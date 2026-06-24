"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerContext } from "@/lib/business/context";
import { fromDatetimeLocalValue } from "@/lib/schedule/datetime";
import { timeOffSchema } from "@/lib/validations/time-off";

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

function parseTimeOffFormData(formData: FormData) {
  return timeOffSchema.safeParse({
    scope: formData.get("scope"),
    employeeId: formData.get("employeeId"),
    type: formData.get("type"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    reason: formData.get("reason"),
  });
}

export async function createTimeOff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseTimeOffFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  if (parsed.data.scope === "employee" && parsed.data.employeeId) {
    const ownsEmployee = await verifyEmployeeOwnership(
      supabase,
      business.id,
      parsed.data.employeeId
    );
    if (!ownsEmployee) {
      return { error: "Staff member not found." };
    }
  }

  const { error } = await supabase.from("book_time_off").insert({
    business_id: business.id,
    employee_id:
      parsed.data.scope === "employee" ? parsed.data.employeeId : null,
    scope: parsed.data.scope,
    type: parsed.data.type,
    starts_at: fromDatetimeLocalValue(
      parsed.data.startsAt,
      business.timezone
    ),
    ends_at: fromDatetimeLocalValue(parsed.data.endsAt, business.timezone),
    reason: parsed.data.reason,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateSchedule();
  return { success: "Time off added." };
}

export async function updateTimeOff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const timeOffId = formData.get("timeOffId");
  if (typeof timeOffId !== "string" || !timeOffId) {
    return { error: "Entry not found." };
  }

  const parsed = parseTimeOffFormData(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  if (parsed.data.scope === "employee" && parsed.data.employeeId) {
    const ownsEmployee = await verifyEmployeeOwnership(
      supabase,
      business.id,
      parsed.data.employeeId
    );
    if (!ownsEmployee) {
      return { error: "Staff member not found." };
    }
  }

  const { error } = await supabase
    .from("book_time_off")
    .update({
      employee_id:
        parsed.data.scope === "employee" ? parsed.data.employeeId : null,
      scope: parsed.data.scope,
      type: parsed.data.type,
      starts_at: fromDatetimeLocalValue(
        parsed.data.startsAt,
        business.timezone
      ),
      ends_at: fromDatetimeLocalValue(parsed.data.endsAt, business.timezone),
      reason: parsed.data.reason,
    })
    .eq("id", timeOffId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateSchedule();
  return { success: "Time off updated." };
}

export async function deleteTimeOff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const timeOffId = formData.get("timeOffId");
  if (typeof timeOffId !== "string" || !timeOffId) {
    return { error: "Entry not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_time_off")
    .delete()
    .eq("id", timeOffId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateSchedule();
  return { success: "Time off removed." };
}

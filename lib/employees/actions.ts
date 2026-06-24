"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerContext } from "@/lib/business/context";
import {
  employeeSchema,
  employeeServiceSchema,
} from "@/lib/validations/employees";

export type ActionState = {
  error?: string;
  success?: string;
};

const EMPLOYEES_PATH = "/employees";

function revalidateEmployees() {
  revalidatePath(EMPLOYEES_PATH);
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

async function verifyServiceOwnership(
  supabase: Awaited<ReturnType<typeof requireOwnerContext>>["supabase"],
  businessId: string,
  serviceId: string
) {
  const { data } = await supabase
    .from("book_services")
    .select("id")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();

  return Boolean(data);
}

export async function createEmployee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = employeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase.from("book_employees").insert({
    business_id: business.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    is_active: parsed.data.isActive ?? true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Staff member added." };
}

export async function updateEmployee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) {
    return { error: "Staff member not found." };
  }

  const parsed = employeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_employees")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      is_active: parsed.data.isActive ?? true,
    })
    .eq("id", employeeId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Staff member updated." };
}

export async function deleteEmployee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) {
    return { error: "Staff member not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_employees")
    .delete()
    .eq("id", employeeId)
    .eq("business_id", business.id);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Cannot delete this staff member because they have existing bookings.",
      };
    }
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Staff member removed." };
}

export async function toggleEmployeeActive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeId = formData.get("employeeId");
  const isActive = formData.get("isActive");

  if (typeof employeeId !== "string" || !employeeId) {
    return { error: "Staff member not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_employees")
    .update({ is_active: isActive === "true" })
    .eq("id", employeeId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Staff member updated." };
}

export async function assignEmployeeService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = employeeServiceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    serviceId: formData.get("serviceId"),
    priceOverride: formData.get("priceOverride"),
    durationOverrideMinutes: formData.get("durationOverrideMinutes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const [ownsEmployee, ownsService] = await Promise.all([
    verifyEmployeeOwnership(supabase, business.id, parsed.data.employeeId),
    verifyServiceOwnership(supabase, business.id, parsed.data.serviceId),
  ]);

  if (!ownsEmployee || !ownsService) {
    return { error: "Staff member or service not found." };
  }

  const { error } = await supabase.from("book_employee_services").insert({
    business_id: business.id,
    employee_id: parsed.data.employeeId,
    service_id: parsed.data.serviceId,
    price_override: parsed.data.priceOverride,
    duration_override_minutes: parsed.data.durationOverrideMinutes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This service is already assigned to this staff member." };
    }
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Service assigned." };
}

export async function updateEmployeeService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !assignmentId) {
    return { error: "Assignment not found." };
  }

  const parsed = employeeServiceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    serviceId: formData.get("serviceId"),
    priceOverride: formData.get("priceOverride"),
    durationOverrideMinutes: formData.get("durationOverrideMinutes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_employee_services")
    .update({
      price_override: parsed.data.priceOverride,
      duration_override_minutes: parsed.data.durationOverrideMinutes,
    })
    .eq("id", assignmentId)
    .eq("business_id", business.id)
    .eq("employee_id", parsed.data.employeeId)
    .eq("service_id", parsed.data.serviceId);

  if (error) {
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Assignment updated." };
}

export async function removeEmployeeService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !assignmentId) {
    return { error: "Assignment not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_employee_services")
    .delete()
    .eq("id", assignmentId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateEmployees();
  return { success: "Service removed from staff member." };
}

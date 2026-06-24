"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerContext } from "@/lib/business/context";
import {
  serviceCategorySchema,
  serviceSchema,
} from "@/lib/validations/services";

export type ActionState = {
  error?: string;
  success?: string;
};

const SERVICES_PATH = "/services";

function revalidateServices() {
  revalidatePath(SERVICES_PATH);
  revalidatePath("/dashboard");
}

export async function createServiceCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = serviceCategorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase.from("book_service_categories").insert({
    business_id: business.id,
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Category created." };
}

export async function updateServiceCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category not found." };
  }

  const parsed = serviceCategorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_service_categories")
    .update({
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Category updated." };
}

export async function deleteServiceCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "Category not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_service_categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Category deleted." };
}

export async function createService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes") ?? 0,
    price: formData.get("price"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  if (parsed.data.categoryId) {
    const { data: category } = await supabase
      .from("book_service_categories")
      .select("id")
      .eq("id", parsed.data.categoryId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!category) {
      return { error: "Selected category not found." };
    }
  }

  const { error } = await supabase.from("book_services").insert({
    business_id: business.id,
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description,
    duration_minutes: parsed.data.durationMinutes,
    buffer_minutes: parsed.data.bufferMinutes,
    price: parsed.data.price,
    is_active: parsed.data.isActive ?? true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Service created." };
}

export async function updateService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const serviceId = formData.get("serviceId");
  if (typeof serviceId !== "string" || !serviceId) {
    return { error: "Service not found." };
  }

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    durationMinutes: formData.get("durationMinutes"),
    bufferMinutes: formData.get("bufferMinutes") ?? 0,
    price: formData.get("price"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, business } = await requireOwnerContext();

  if (parsed.data.categoryId) {
    const { data: category } = await supabase
      .from("book_service_categories")
      .select("id")
      .eq("id", parsed.data.categoryId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!category) {
      return { error: "Selected category not found." };
    }
  }

  const { error } = await supabase
    .from("book_services")
    .update({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description,
      duration_minutes: parsed.data.durationMinutes,
      buffer_minutes: parsed.data.bufferMinutes,
      price: parsed.data.price,
      is_active: parsed.data.isActive ?? true,
    })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Service updated." };
}

export async function deleteService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const serviceId = formData.get("serviceId");
  if (typeof serviceId !== "string" || !serviceId) {
    return { error: "Service not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Service deleted." };
}

export async function toggleServiceActive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const serviceId = formData.get("serviceId");
  const isActive = formData.get("isActive");

  if (typeof serviceId !== "string" || !serviceId) {
    return { error: "Service not found." };
  }

  const { supabase, business } = await requireOwnerContext();

  const { error } = await supabase
    .from("book_services")
    .update({ is_active: isActive === "true" })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidateServices();
  return { success: "Service updated." };
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type Employee = {
  id: string;
  business_id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type EmployeeServiceAssignment = {
  id: string;
  employee_id: string;
  service_id: string;
  price_override: number | null;
  duration_override_minutes: number | null;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
  };
};

export async function getEmployees(
  supabase: SupabaseClient,
  businessId: string
): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("book_employees")
    .select(
      "id, business_id, full_name, email, avatar_url, is_active, created_at"
    )
    .eq("business_id", businessId)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getEmployeeServiceAssignments(
  supabase: SupabaseClient,
  businessId: string
): Promise<EmployeeServiceAssignment[]> {
  const { data, error } = await supabase
    .from("book_employee_services")
    .select(
      `
      id,
      employee_id,
      service_id,
      price_override,
      duration_override_minutes,
      service:book_services!inner (
        id,
        name,
        duration_minutes,
        price,
        is_active
      )
    `
    )
    .eq("business_id", businessId)
    .order("employee_id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const service = Array.isArray(row.service) ? row.service[0] : row.service;
    return {
      id: row.id,
      employee_id: row.employee_id,
      service_id: row.service_id,
      price_override:
        row.price_override === null ? null : Number(row.price_override),
      duration_override_minutes: row.duration_override_minutes,
      service: {
        ...service,
        price: Number(service.price),
      },
    };
  });
}

export function groupAssignmentsByEmployee(
  assignments: EmployeeServiceAssignment[]
): Map<string, EmployeeServiceAssignment[]> {
  const map = new Map<string, EmployeeServiceAssignment[]>();
  for (const assignment of assignments) {
    const list = map.get(assignment.employee_id) ?? [];
    list.push(assignment);
    map.set(assignment.employee_id, list);
  }
  return map;
}

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ConfirmationMode } from "@/lib/constants/booking-settings";
import {
  getEmployeeServiceAssignments,
  getEmployees,
  type Employee,
  type EmployeeServiceAssignment,
} from "@/lib/employees/queries";
import {
  getServiceCategories,
  getServices,
  type Service,
  type ServiceCategory,
} from "@/lib/services/queries";

export type PublicBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  currency: string;
  brand_color: string | null;
  confirmation_mode: ConfirmationMode;
  allow_any_employee: boolean;
  max_horizon_days: number;
};

export type PublicCatalog = {
  business: PublicBusiness;
  categories: ServiceCategory[];
  services: Service[];
  employees: Employee[];
  assignments: EmployeeServiceAssignment[];
};

export async function getPublicBusinessBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<PublicBusiness | null> {
  const { data, error } = await supabase
    .from("book_businesses")
    .select(
      "id, name, slug, description, timezone, currency, brand_color, confirmation_mode, allow_any_employee, max_horizon_days"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPublicCatalog(
  supabase: SupabaseClient,
  slug: string
): Promise<PublicCatalog | null> {
  const business = await getPublicBusinessBySlug(supabase, slug);

  if (!business) {
    return null;
  }

  const [categories, services, employees, assignments] = await Promise.all([
    getServiceCategories(supabase, business.id),
    getServices(supabase, business.id),
    getEmployees(supabase, business.id),
    getEmployeeServiceAssignments(supabase, business.id),
  ]);

  const activeServices = services.filter((service) => service.is_active);
  const activeEmployees = employees.filter((employee) => employee.is_active);
  const activeServiceIds = new Set(activeServices.map((service) => service.id));
  const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.id));

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.service.is_active &&
      activeServiceIds.has(assignment.service_id) &&
      activeEmployeeIds.has(assignment.employee_id)
  );

  return {
    business,
    categories,
    services: activeServices,
    employees: activeEmployees,
    assignments: activeAssignments,
  };
}

export function getEmployeesForService(
  catalog: PublicCatalog,
  serviceId: string
): Employee[] {
  const employeeIds = new Set(
    catalog.assignments
      .filter((assignment) => assignment.service_id === serviceId)
      .map((assignment) => assignment.employee_id)
  );

  return catalog.employees.filter((employee) => employeeIds.has(employee.id));
}

export function getServiceOffering(
  catalog: PublicCatalog,
  serviceId: string,
  employeeId: string
): EmployeeServiceAssignment | undefined {
  return catalog.assignments.find(
    (assignment) =>
      assignment.service_id === serviceId &&
      assignment.employee_id === employeeId
  );
}

export function getEffectivePrice(
  service: Service,
  assignment: EmployeeServiceAssignment | undefined
): number {
  return assignment?.price_override ?? service.price;
}

export function getEffectiveDuration(
  service: Service,
  assignment: EmployeeServiceAssignment | undefined
): number {
  return assignment?.duration_override_minutes ?? service.duration_minutes;
}

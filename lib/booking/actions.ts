"use server";

import {
  sendBookingConfirmationEmail,
  sendOwnerBookingNotificationEmail,
} from "@/lib/email";
import {
  getEmployeesForService,
  getPublicCatalog,
  getServiceOffering,
} from "@/lib/booking/queries";
import { getAvailableSlots } from "@/lib/booking/slots";
import { isBookingConflict } from "@/lib/bookings/utils";
import type { ConfirmationMode } from "@/lib/constants/booking-settings";
import {
  createBookingSchema,
  fetchSlotsSchema,
} from "@/lib/validations/booking";
import { enforceRateLimit } from "@/lib/rate-limit/guard";
import { RATE_LIMITS } from "@/lib/rate-limit/index";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export type FetchSlotsResult =
  | {
      ok: true;
      slots: Array<{ startsAt: string; employeeId: string }>;
    }
  | { ok: false; error: string };

export type CreateBookingResult =
  | {
      ok: true;
      booking: {
        id: string;
        status: "pending" | "confirmed";
        startsAt: string;
        confirmationMode: ConfirmationMode;
        manageToken: string;
      };
      emailSent: boolean;
    }
  | { ok: false; error: string; conflict?: boolean };

type BookingRow = {
  id: string;
  status: "pending" | "confirmed";
  starts_at: string;
  manage_token: string;
  price: number;
  employee_id: string;
};

export async function fetchAvailableSlots(
  input: unknown
): Promise<FetchSlotsResult> {
  const rateLimitError = await enforceRateLimit(
    "booking:slots",
    RATE_LIMITS.bookingSlots
  );

  if (rateLimitError) {
    return { ok: false, error: rateLimitError };
  }

  const parsed = fetchSlotsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("book_businesses")
    .select("id, slug")
    .eq("id", parsed.data.businessId)
    .maybeSingle();

  if (businessError || !business) {
    return { ok: false, error: "Business not found" };
  }

  const catalog = await getPublicCatalog(supabase, business.slug);

  if (!catalog) {
    return { ok: false, error: "Business not found" };
  }

  const eligibleEmployees = getEmployeesForService(
    catalog,
    parsed.data.serviceId
  );
  const employeeIds = eligibleEmployees.map((employee) => employee.id);

  if (employeeIds.length === 0) {
    return { ok: true, slots: [] };
  }

  const employeeId =
    parsed.data.employeeId && parsed.data.employeeId !== "any"
      ? parsed.data.employeeId
      : null;

  if (employeeId && !employeeIds.includes(employeeId)) {
    return { ok: false, error: "This staff member does not offer this service" };
  }

  try {
    const slots = await getAvailableSlots({
      businessId: catalog.business.id,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      employeeId,
      employeeIds,
    });

    return { ok: true, slots };
  } catch {
    return { ok: false, error: "Could not load available times" };
  }
}

export async function createBooking(
  input: unknown
): Promise<CreateBookingResult> {
  const rateLimitError = await enforceRateLimit(
    "booking:create",
    RATE_LIMITS.bookingCreate
  );

  if (rateLimitError) {
    return { ok: false, error: rateLimitError };
  }

  const parsed = createBookingSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("book_businesses")
    .select("id, slug, owner_id")
    .eq("id", parsed.data.businessId)
    .maybeSingle();

  if (businessError || !business) {
    return { ok: false, error: "Business not found" };
  }

  const catalog = await getPublicCatalog(supabase, business.slug);

  if (!catalog) {
    return { ok: false, error: "Business not found" };
  }

  const service = catalog.services.find(
    (item) => item.id === parsed.data.serviceId
  );

  if (!service) {
    return { ok: false, error: "Service not found" };
  }

  const employee = catalog.employees.find(
    (item) => item.id === parsed.data.employeeId
  );

  if (!employee) {
    return { ok: false, error: "Staff member not found" };
  }

  const offering = getServiceOffering(
    catalog,
    parsed.data.serviceId,
    parsed.data.employeeId
  );

  if (!offering) {
    return {
      ok: false,
      error: "This staff member does not offer the selected service",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("book_create_booking", {
    p_business_id: parsed.data.businessId,
    p_employee_id: parsed.data.employeeId,
    p_service_id: parsed.data.serviceId,
    p_starts_at: parsed.data.startsAt,
    p_client_name: parsed.data.clientName,
    p_client_email: parsed.data.clientEmail,
    p_client_phone: parsed.data.clientPhone,
  });

  if (error) {
    if (isBookingConflict(error)) {
      return {
        ok: false,
        error: "This time was just taken. Please pick another slot.",
        conflict: true,
      };
    }

    return { ok: false, error: "Could not create booking. Please try again." };
  }

  const booking = data as BookingRow;
  const price =
    offering.price_override !== null
      ? Number(offering.price_override)
      : service.price;

  const emailResult = await sendBookingConfirmationEmail({
    businessName: catalog.business.name,
    serviceName: service.name,
    employeeName: employee.full_name,
    startsAt: booking.starts_at,
    timezone: catalog.business.timezone,
    currency: catalog.business.currency,
    price: Number(booking.price ?? price),
    status: booking.status,
    clientName: parsed.data.clientName,
    clientEmail: parsed.data.clientEmail,
    manageToken: booking.manage_token,
  });

  if (business.owner_id) {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(
      business.owner_id
    );
    const ownerEmail = ownerAuth.user?.email;

    if (ownerEmail) {
      await sendOwnerBookingNotificationEmail({
        businessName: catalog.business.name,
        serviceName: service.name,
        employeeName: employee.full_name,
        startsAt: booking.starts_at,
        timezone: catalog.business.timezone,
        currency: catalog.business.currency,
        price: Number(booking.price ?? price),
        clientName: parsed.data.clientName,
        clientEmail: parsed.data.clientEmail,
        clientPhone: parsed.data.clientPhone,
        status: booking.status,
        source: "online",
        ownerEmail,
      });
    }
  }

  return {
    ok: true,
    booking: {
      id: booking.id,
      status: booking.status,
      startsAt: booking.starts_at,
      confirmationMode: catalog.business.confirmation_mode,
      manageToken: booking.manage_token,
    },
    emailSent: emailResult.sent,
  };
}

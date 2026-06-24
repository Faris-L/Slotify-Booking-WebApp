import { formatInTimeZone } from "date-fns-tz";
import { addWeeks, startOfWeek, subWeeks } from "date-fns";

import { CalendarView } from "@/components/bookings/calendar-view";
import { getBookingsInRange } from "@/lib/bookings/queries";
import { requireOwnerContext } from "@/lib/business/context";
import { getEmployees } from "@/lib/employees/queries";
import { getServices } from "@/lib/services/queries";

export default async function CalendarPage() {
  const { supabase, business } = await requireOwnerContext();

  const today = formatInTimeZone(new Date(), business.timezone, "yyyy-MM-dd");
  const weekStart = startOfWeek(new Date(`${today}T12:00:00`), {
    weekStartsOn: 1,
  });
  const rangeStart = subWeeks(weekStart, 1);
  const rangeEnd = addWeeks(weekStart, 3);

  const [bookings, employees, services] = await Promise.all([
    getBookingsInRange(
      supabase,
      business.id,
      rangeStart.toISOString(),
      rangeEnd.toISOString()
    ),
    getEmployees(supabase, business.id),
    getServices(supabase, business.id),
  ]);

  return (
    <CalendarView
      bookings={bookings}
      timezone={business.timezone}
      currency={business.currency}
      employees={employees}
      services={services}
      initialDate={today}
    />
  );
}

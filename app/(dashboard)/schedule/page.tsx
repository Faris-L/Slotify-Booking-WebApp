import Link from "next/link";

import { BusinessHoursForm } from "@/components/schedule/business-hours-form";
import { EmployeeHoursPanel } from "@/components/schedule/employee-hours-panel";
import { TimeOffSection } from "@/components/schedule/time-off-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireOwnerContext } from "@/lib/business/context";
import { seedDefaultBusinessHours } from "@/lib/business/hours";
import { getEmployees } from "@/lib/employees/queries";
import {
  getAllEmployeeHours,
  getBusinessHours,
} from "@/lib/schedule/queries";
import {
  getTimeOffEntries,
  splitTimeOffEntries,
} from "@/lib/schedule/time-off-queries";

export default async function SchedulePage() {
  const { supabase, business } = await requireOwnerContext();

  await seedDefaultBusinessHours(supabase, business.id);

  const [businessHours, employees, allEmployeeHours, timeOffEntries] =
    await Promise.all([
      getBusinessHours(supabase, business.id),
      getEmployees(supabase, business.id),
      getAllEmployeeHours(supabase, business.id),
      getTimeOffEntries(supabase, business.id),
    ]);

  const employeeHoursByEmployee = new Map<string, typeof allEmployeeHours>();
  for (const row of allEmployeeHours) {
    const list = employeeHoursByEmployee.get(row.employee_id) ?? [];
    list.push(row);
    employeeHoursByEmployee.set(row.employee_id, list);
  }

  const { business: businessTimeOff, employee: staffTimeOff } =
    splitTimeOffEntries(timeOffEntries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Schedule
        </h1>
        <p className="mt-1 text-muted-foreground">
          Working hours, closures, breaks, and staff-specific unavailability.
        </p>
      </div>

      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>Business hours</CardTitle>
          <CardDescription>
            Default opening hours used for availability unless a staff member has
            a custom schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessHoursForm hours={businessHours} />
        </CardContent>
      </Card>

      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>Staff schedule overrides</CardTitle>
          <CardDescription>
            Override specific days for individual team members. Days left on
            business default inherit the hours above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add staff on the{" "}
              <Link href="/employees" className="text-primary hover:underline">
                Staff
              </Link>{" "}
              page to configure individual schedules.
            </p>
          ) : (
            employees.map((employee) => (
              <EmployeeHoursPanel
                key={employee.id}
                employee={employee}
                businessHours={businessHours}
                employeeHours={employeeHoursByEmployee.get(employee.id) ?? []}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>Time off</CardTitle>
          <CardDescription>
            Holidays, blocked periods, and breaks that reduce available booking
            slots. Times use timezone {business.timezone}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <TimeOffSection
            title="Business-wide"
            description="Applies to the entire business — no bookings during these periods."
            entries={businessTimeOff}
            scope="business"
            employees={employees}
            timezone={business.timezone}
            emptyMessage="No business-wide closures or blocks yet."
          />

          <TimeOffSection
            title="Staff-specific"
            description="Unavailable periods for individual team members only."
            entries={staffTimeOff}
            scope="employee"
            employees={employees}
            timezone={business.timezone}
            showEmployee
            emptyMessage={
              employees.length === 0
                ? "Add staff members before scheduling individual time off."
                : "No staff-specific time off yet."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmployeeList } from "@/components/employees/employee-list";
import { requireOwnerContext } from "@/lib/business/context";
import {
  getEmployeeServiceAssignments,
  getEmployees,
  groupAssignmentsByEmployee,
} from "@/lib/employees/queries";
import { getServices } from "@/lib/services/queries";

export default async function EmployeesPage() {
  const { supabase, business } = await requireOwnerContext();

  const [employees, assignments, services] = await Promise.all([
    getEmployees(supabase, business.id),
    getEmployeeServiceAssignments(supabase, business.id),
    getServices(supabase, business.id),
  ]);

  const assignmentsByEmployee = groupAssignmentsByEmployee(assignments);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Staff
        </h1>
        <p className="mt-1 text-muted-foreground">
          Add team members and assign the services they provide.
        </p>
      </div>

      <Card className="border-sky-100">
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            {employees.length} staff member{employees.length === 1 ? "" : "s"} ·
            prices in {business.currency}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeList
            employees={employees}
            assignmentsByEmployee={assignmentsByEmployee}
            services={services}
            currency={business.currency}
          />
        </CardContent>
      </Card>
    </div>
  );
}

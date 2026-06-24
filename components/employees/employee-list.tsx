"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  assignEmployeeService,
  createEmployee,
  deleteEmployee,
  removeEmployeeService,
  toggleEmployeeActive,
  updateEmployee,
  updateEmployeeService,
  type ActionState,
} from "@/lib/employees/actions";
import type {
  Employee,
  EmployeeServiceAssignment,
} from "@/lib/employees/queries";
import type { Service } from "@/lib/services/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState: ActionState = {};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function EmployeeFormFields({ employee }: { employee?: Employee }) {
  const activeId = employee
    ? `emp-active-hidden-${employee.id}`
    : "new-emp-active-hidden";

  return (
    <>
      {employee ? (
        <input type="hidden" name="employeeId" value={employee.id} />
      ) : null}
      <div className="space-y-1">
        <Label htmlFor={employee ? `emp-name-${employee.id}` : "new-emp-name"}>
          Full name
        </Label>
        <Input
          id={employee ? `emp-name-${employee.id}` : "new-emp-name"}
          name="fullName"
          required
          defaultValue={employee?.full_name}
          placeholder="Alex Morgan"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={employee ? `emp-email-${employee.id}` : "new-emp-email"}>
          Email
        </Label>
        <Input
          id={employee ? `emp-email-${employee.id}` : "new-emp-email"}
          name="email"
          type="email"
          defaultValue={employee?.email ?? ""}
          placeholder="Optional — for future notifications"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="hidden"
          name="isActive"
          value={employee?.is_active !== false ? "true" : "false"}
          id={activeId}
        />
        <Switch
          defaultChecked={employee?.is_active !== false}
          onCheckedChange={(checked) => {
            const hidden = document.getElementById(
              activeId
            ) as HTMLInputElement | null;
            if (hidden) {
              hidden.value = checked ? "true" : "false";
            }
          }}
        />
        <Label>Active on public page</Label>
      </div>
    </>
  );
}

function AssignmentRow({
  assignment,
  employeeId,
  currency,
}: {
  assignment: EmployeeServiceAssignment;
  employeeId: string;
  currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, updateAction, updatePending] = useActionState(
    updateEmployeeService,
    initialState
  );
  const [, removeAction, removePending] = useActionState(
    removeEmployeeService,
    initialState
  );

  const effectivePrice =
    assignment.price_override ?? assignment.service.price;
  const effectiveDuration =
    assignment.duration_override_minutes ?? assignment.service.duration_minutes;

  if (editing) {
    return (
      <form
        action={updateAction}
        className="space-y-3 rounded-lg border border-border bg-muted/30 p-3"
      >
        <input type="hidden" name="assignmentId" value={assignment.id} />
        <input type="hidden" name="employeeId" value={employeeId} />
        <input type="hidden" name="serviceId" value={assignment.service_id} />
        <p className="text-sm font-medium">{assignment.service.name}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`price-${assignment.id}`}>
              Price override ({currency})
            </Label>
            <Input
              id={`price-${assignment.id}`}
              name="priceOverride"
              type="number"
              min={0}
              step="0.01"
              placeholder={String(assignment.service.price)}
              defaultValue={assignment.price_override ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Default: {formatPrice(assignment.service.price, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`dur-${assignment.id}`}>
              Duration override (min)
            </Label>
            <Input
              id={`dur-${assignment.id}`}
              name="durationOverrideMinutes"
              type="number"
              min={5}
              max={480}
              placeholder={String(assignment.service.duration_minutes)}
              defaultValue={assignment.duration_override_minutes ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Default: {assignment.service.duration_minutes} min
            </p>
          </div>
        </div>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={updatePending}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{assignment.service.name}</p>
        <p className="text-xs text-muted-foreground">
          {effectiveDuration} min · {formatPrice(effectivePrice, currency)}
          {assignment.price_override !== null ||
          assignment.duration_override_minutes !== null ? (
            <span> · custom</span>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${assignment.service.name} assignment`}
        >
          <Pencil className="size-3.5" />
        </Button>
        <form action={removeAction}>
          <input type="hidden" name="assignmentId" value={assignment.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            disabled={removePending}
            aria-label={`Remove ${assignment.service.name}`}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function AssignServiceForm({
  employeeId,
  services,
  assignedServiceIds,
  currency,
}: {
  employeeId: string;
  services: Service[];
  assignedServiceIds: Set<string>;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    assignEmployeeService,
    initialState
  );

  const available = services.filter((s) => !assignedServiceIds.has(s.id));

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        All services are already assigned.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Assign service
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-sky-100 bg-sky-50/50 p-3"
    >
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="space-y-1">
        <Label htmlFor={`assign-svc-${employeeId}`}>Service</Label>
        <select
          id={`assign-svc-${employeeId}`}
          name="serviceId"
          required
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select a service</option>
          {available.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min ·{" "}
              {formatPrice(service.price, currency)})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`assign-price-${employeeId}`}>
            Price override ({currency})
          </Label>
          <Input
            id={`assign-price-${employeeId}`}
            name="priceOverride"
            type="number"
            min={0}
            step="0.01"
            placeholder="Use service default"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`assign-dur-${employeeId}`}>
            Duration override (min)
          </Label>
          <Input
            id={`assign-dur-${employeeId}`}
            name="durationOverrideMinutes"
            type="number"
            min={5}
            max={480}
            placeholder="Use service default"
          />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Assign
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EmployeeServicesSection({
  employee,
  assignments,
  services,
  currency,
}: {
  employee: Employee;
  assignments: EmployeeServiceAssignment[];
  services: Service[];
  currency: string;
}) {
  const assignedIds = new Set(assignments.map((a) => a.service_id));

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="text-sm font-medium">Assigned services</p>
        <p className="text-xs text-muted-foreground">
          Override price or duration per staff member. Leave blank to use service
          defaults.
        </p>
      </div>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No services assigned yet.
        </p>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              employeeId={employee.id}
              currency={currency}
            />
          ))}
        </div>
      )}
      <AssignServiceForm
        employeeId={employee.id}
        services={services}
        assignedServiceIds={assignedIds}
        currency={currency}
      />
    </div>
  );
}

function EmployeeForm({
  employee,
  assignments,
  services,
  currency,
  onCancel,
}: {
  employee?: Employee;
  assignments: EmployeeServiceAssignment[];
  services: Service[];
  currency: string;
  onCancel?: () => void;
}) {
  const action = employee ? updateEmployee : createEmployee;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4">
      <form action={formAction} className="space-y-4">
        <EmployeeFormFields employee={employee} />
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {employee ? "Save staff member" : "Add staff member"}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
      {employee ? (
        <EmployeeServicesSection
          employee={employee}
          assignments={assignments}
          services={services}
          currency={currency}
        />
      ) : null}
    </div>
  );
}

function EmployeeRow({
  employee,
  assignments,
  services,
  currency,
}: {
  employee: Employee;
  assignments: EmployeeServiceAssignment[];
  services: Service[];
  currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [, deleteAction, deletePending] = useActionState(
    deleteEmployee,
    initialState
  );
  const [, toggleAction, togglePending] = useActionState(
    toggleEmployeeActive,
    initialState
  );

  if (editing) {
    return (
      <EmployeeForm
        employee={employee}
        assignments={assignments}
        services={services}
        currency={currency}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{employee.full_name}</p>
            {!employee.is_active ? (
              <Badge variant="secondary">Hidden</Badge>
            ) : null}
          </div>
          {employee.email ? (
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {assignments.length} service
            {assignments.length === 1 ? "" : "s"} assigned
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <form action={toggleAction} className="flex items-center gap-2 pr-2">
            <input type="hidden" name="employeeId" value={employee.id} />
            <input
              type="hidden"
              name="isActive"
              value={employee.is_active ? "false" : "true"}
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={togglePending}
            >
              {employee.is_active ? "Hide" : "Show"}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${employee.full_name}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <form action={deleteAction}>
            <input type="hidden" name="employeeId" value={employee.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              disabled={deletePending}
              aria-label={`Delete ${employee.full_name}`}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </form>
        </div>
      </div>
      <EmployeeServicesSection
        employee={employee}
        assignments={assignments}
        services={services}
        currency={currency}
      />
    </div>
  );
}

export function EmployeeList({
  employees,
  assignmentsByEmployee,
  services,
  currency,
}: {
  employees: Employee[];
  assignmentsByEmployee: Map<string, EmployeeServiceAssignment[]>;
  services: Service[];
  currency: string;
}) {
  const [showNew, setShowNew] = useState(false);

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least one service on the{" "}
        <Link href="/services" className="text-primary hover:underline">
          Services
        </Link>{" "}
        page before assigning staff.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {employees.length === 0 && !showNew ? (
        <p className="text-sm text-muted-foreground">
          No staff members yet. Add your first team member below.
        </p>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              assignments={assignmentsByEmployee.get(employee.id) ?? []}
              services={services}
              currency={currency}
            />
          ))}
        </div>
      )}

      {showNew ? (
        <EmployeeForm
          assignments={[]}
          services={services}
          currency={currency}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNew(true)}
        >
          Add staff member
        </Button>
      )}
    </div>
  );
}

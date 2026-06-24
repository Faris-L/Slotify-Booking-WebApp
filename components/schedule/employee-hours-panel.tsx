"use client";

import { useActionState } from "react";

import {
  clearEmployeeHours,
  updateEmployeeHours,
  type ActionState,
} from "@/lib/schedule/actions";
import type {
  BusinessHoursRow,
  EmployeeHoursRow,
} from "@/lib/schedule/queries";
import {
  employeeHasOverrides,
  indexHoursByWeekday,
  resolveEmployeeWeek,
} from "@/lib/schedule/queries";
import type { Employee } from "@/lib/employees/queries";
import { HoursGrid } from "@/components/schedule/hours-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function EmployeeHoursPanel({
  employee,
  businessHours,
  employeeHours,
}: {
  employee: Employee;
  businessHours: BusinessHoursRow[];
  employeeHours: EmployeeHoursRow[];
}) {
  const [state, formAction, pending] = useActionState(
    updateEmployeeHours,
    initialState
  );
  const [, clearAction, clearPending] = useActionState(
    clearEmployeeHours,
    initialState
  );

  const employeeByDay = indexHoursByWeekday(employeeHours);
  const businessByDay = indexHoursByWeekday(businessHours);
  const resolved = resolveEmployeeWeek(businessHours, employeeHours);

  const initialModeByWeekday = new Map<number, "inherit" | "custom">(
    resolved.map((day) => [
      day.weekday,
      employeeByDay.has(day.weekday) ? "custom" : "inherit",
    ])
  );

  const displayDays = resolved.map((day) => {
    const override = employeeByDay.get(day.weekday);
    return override
      ? {
          weekday: day.weekday,
          open_time: override.open_time,
          close_time: override.close_time,
          is_closed: override.is_closed,
        }
      : {
          weekday: day.weekday,
          open_time: businessByDay.get(day.weekday)?.open_time ?? day.open_time,
          close_time:
            businessByDay.get(day.weekday)?.close_time ?? day.close_time,
          is_closed:
            businessByDay.get(day.weekday)?.is_closed ?? day.is_closed,
        };
  });

  const hasOverrides = employeeHasOverrides(employeeHours);

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{employee.full_name}</p>
          {hasOverrides ? (
            <Badge variant="outline">Custom schedule</Badge>
          ) : (
            <Badge variant="secondary">Business default</Badge>
          )}
        </div>
        {hasOverrides ? (
          <form action={clearAction}>
            <input type="hidden" name="employeeId" value={employee.id} />
            <Button type="submit" variant="outline" size="sm" disabled={clearPending}>
              Reset all days
            </Button>
          </form>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="employeeId" value={employee.id} />
        <HoursGrid
          prefix={`emp-${employee.id}-`}
          days={displayDays}
          showMode
          initialModeByWeekday={initialModeByWeekday}
          inheritedByWeekday={businessByDay}
        />
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-600">{state.success}</p>
        ) : null}
        <Button type="submit" size="sm" disabled={pending}>
          Save schedule
        </Button>
      </form>
    </div>
  );
}

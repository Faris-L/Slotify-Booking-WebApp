"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  TIME_OFF_TYPES,
  getTimeOffTypeLabel,
  type TimeOffScope,
} from "@/lib/constants/time-off";
import {
  createTimeOff,
  deleteTimeOff,
  updateTimeOff,
  type ActionState,
} from "@/lib/schedule/time-off-actions";
import type { TimeOffEntry } from "@/lib/schedule/time-off-queries";
import {
  formatTimeOffRange,
  toDatetimeLocalValue,
} from "@/lib/schedule/datetime";
import type { Employee } from "@/lib/employees/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

function TimeOffFormFields({
  entry,
  scope,
  employees,
  timezone,
}: {
  entry?: TimeOffEntry;
  scope: TimeOffScope;
  employees: Employee[];
  timezone: string;
}) {
  const defaultStarts = entry
    ? toDatetimeLocalValue(entry.starts_at, timezone)
    : "";
  const defaultEnds = entry ? toDatetimeLocalValue(entry.ends_at, timezone) : "";

  return (
    <>
      {entry ? <input type="hidden" name="timeOffId" value={entry.id} /> : null}
      <input type="hidden" name="scope" value={scope} />

      {scope === "employee" ? (
        <div className="space-y-1">
          <Label htmlFor={entry ? `emp-${entry.id}` : "new-time-off-employee"}>
            Staff member
          </Label>
          <select
            id={entry ? `emp-${entry.id}` : "new-time-off-employee"}
            name="employeeId"
            required
            defaultValue={entry?.employee_id ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Select staff</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="employeeId" value="" />
      )}

      <div className="space-y-1">
        <Label htmlFor={entry ? `type-${entry.id}` : "new-time-off-type"}>
          Type
        </Label>
        <select
          id={entry ? `type-${entry.id}` : "new-time-off-type"}
          name="type"
          required
          defaultValue={entry?.type ?? "holiday"}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {TIME_OFF_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={entry ? `start-${entry.id}` : "new-time-off-start"}>
            Starts
          </Label>
          <Input
            id={entry ? `start-${entry.id}` : "new-time-off-start"}
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaultStarts}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={entry ? `end-${entry.id}` : "new-time-off-end"}>
            Ends
          </Label>
          <Input
            id={entry ? `end-${entry.id}` : "new-time-off-end"}
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={defaultEnds}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={entry ? `reason-${entry.id}` : "new-time-off-reason"}>
          Reason
        </Label>
        <Textarea
          id={entry ? `reason-${entry.id}` : "new-time-off-reason"}
          name="reason"
          rows={2}
          defaultValue={entry?.reason ?? ""}
          placeholder="Optional note (e.g. Christmas, team meeting)"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Times are in your business timezone ({timezone}).
      </p>
    </>
  );
}

function TimeOffForm({
  entry,
  scope,
  employees,
  timezone,
  onCancel,
}: {
  entry?: TimeOffEntry;
  scope: TimeOffScope;
  employees: Employee[];
  timezone: string;
  onCancel?: () => void;
}) {
  const action = entry ? updateTimeOff : createTimeOff;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4"
    >
      <TimeOffFormFields
        entry={entry}
        scope={scope}
        employees={employees}
        timezone={timezone}
      />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {entry ? "Save" : "Add time off"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function TimeOffRow({
  entry,
  scope,
  employees,
  timezone,
  showEmployee = false,
}: {
  entry: TimeOffEntry;
  scope: TimeOffScope;
  employees: Employee[];
  timezone: string;
  showEmployee?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [, deleteAction, deletePending] = useActionState(
    deleteTimeOff,
    initialState
  );

  if (editing) {
    return (
      <TimeOffForm
        entry={entry}
        scope={scope}
        employees={employees}
        timezone={timezone}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const isPast = new Date(entry.ends_at) < new Date();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getTimeOffTypeLabel(entry.type)}</Badge>
          {isPast ? <Badge variant="secondary">Past</Badge> : null}
          {showEmployee && entry.employee ? (
            <Badge variant="secondary">{entry.employee.full_name}</Badge>
          ) : null}
        </div>
        <p className="text-sm font-medium">
          {formatTimeOffRange(entry.starts_at, entry.ends_at, timezone)}
        </p>
        {entry.reason ? (
          <p className="text-sm text-muted-foreground">{entry.reason}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
          aria-label="Edit time off"
        >
          <Pencil className="size-3.5" />
        </Button>
        <form action={deleteAction}>
          <input type="hidden" name="timeOffId" value={entry.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            disabled={deletePending}
            aria-label="Delete time off"
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function TimeOffSection({
  title,
  description,
  entries,
  scope,
  employees,
  timezone,
  showEmployee = false,
  emptyMessage,
}: {
  title: string;
  description: string;
  entries: TimeOffEntry[];
  scope: TimeOffScope;
  employees: Employee[];
  timezone: string;
  showEmployee?: boolean;
  emptyMessage: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const canAdd = scope === "business" || employees.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {entries.length === 0 && !showNew ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <TimeOffRow
              key={entry.id}
              entry={entry}
              scope={scope}
              employees={employees}
              timezone={timezone}
              showEmployee={showEmployee}
            />
          ))}
        </div>
      )}

      {showNew && canAdd ? (
        <TimeOffForm
          scope={scope}
          employees={employees}
          timezone={timezone}
          onCancel={() => setShowNew(false)}
        />
      ) : canAdd ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNew(true)}
        >
          Add time off
        </Button>
      ) : null}
    </div>
  );
}

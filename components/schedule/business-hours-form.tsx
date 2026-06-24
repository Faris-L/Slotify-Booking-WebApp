"use client";

import { useActionState } from "react";

import { updateBusinessHours, type ActionState } from "@/lib/schedule/actions";
import type { BusinessHoursRow } from "@/lib/schedule/queries";
import { HoursGrid } from "@/components/schedule/hours-grid";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function BusinessHoursForm({
  hours,
}: {
  hours: BusinessHoursRow[];
}) {
  const [state, formAction, pending] = useActionState(
    updateBusinessHours,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <HoursGrid prefix="biz-" days={hours} />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        Save business hours
      </Button>
    </form>
  );
}

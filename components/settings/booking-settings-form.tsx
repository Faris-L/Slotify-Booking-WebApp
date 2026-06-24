"use client";

import { useActionState } from "react";

import { CONFIRMATION_MODES } from "@/lib/constants/booking-settings";
import {
  updateBusinessSettings,
  type ActionState,
} from "@/lib/business/settings-actions";
import type { BusinessSettings } from "@/lib/business/settings-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState: ActionState = {};

function formatLeadTime(minutes: number): string {
  if (minutes === 0) {
    return "Clients can book immediately.";
  }
  if (minutes < 60) {
    return `${minutes} minutes minimum notice.`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} minimum notice.`;
  }
  return `${hours}h ${remainder}m minimum notice.`;
}

export function BookingSettingsForm({
  settings,
}: {
  settings: BusinessSettings;
}) {
  const [state, formAction, pending] = useActionState(
    updateBusinessSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="confirmationMode">Confirmation mode</Label>
        <select
          id="confirmationMode"
          name="confirmationMode"
          defaultValue={settings.confirmation_mode}
          className="flex h-8 w-full max-w-md rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {CONFIRMATION_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Automatic confirms bookings right away. Manual review keeps them pending
          until you approve.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minLeadMinutes">Minimum lead time (minutes)</Label>
          <Input
            id="minLeadMinutes"
            name="minLeadMinutes"
            type="number"
            min={0}
            max={10080}
            required
            defaultValue={settings.min_lead_minutes}
          />
          <p className="text-xs text-muted-foreground">
            How far in advance clients must book.{" "}
            {formatLeadTime(settings.min_lead_minutes)}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancelCutoffHours">
            Client cancel/reschedule cutoff (hours)
          </Label>
          <Input
            id="cancelCutoffHours"
            name="cancelCutoffHours"
            type="number"
            min={0}
            max={168}
            required
            defaultValue={settings.cancel_cutoff_hours}
          />
          <p className="text-xs text-muted-foreground">
            Clients cannot change bookings within this window before the
            appointment. Set to 0 to allow changes anytime.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border p-4">
        <input
          type="hidden"
          name="allowAnyEmployee"
          value={settings.allow_any_employee ? "true" : "false"}
          id="allow-any-employee-hidden"
        />
        <Switch
          defaultChecked={settings.allow_any_employee}
          onCheckedChange={(checked) => {
            const hidden = document.getElementById(
              "allow-any-employee-hidden"
            ) as HTMLInputElement | null;
            if (hidden) {
              hidden.value = checked ? "true" : "false";
            }
          }}
        />
        <div className="space-y-1">
          <Label htmlFor="allow-any-employee-hidden">
            Allow &quot;any available staff&quot;
          </Label>
          <p className="text-xs text-muted-foreground">
            When enabled, clients can skip choosing a specific team member and
            book whoever is free for the selected service and time.
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        Save settings
      </Button>
    </form>
  );
}

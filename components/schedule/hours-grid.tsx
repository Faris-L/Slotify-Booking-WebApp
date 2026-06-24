"use client";

import { useState } from "react";

import { WEEKDAYS } from "@/lib/constants/schedule";
import { toTimeInputValue } from "@/lib/schedule/time";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type HoursGridDay = {
  weekday: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

type HoursGridProps = {
  prefix: string;
  days: HoursGridDay[];
  showMode?: boolean;
  initialModeByWeekday?: Map<number, "inherit" | "custom">;
  inheritedByWeekday?: Map<number, HoursGridDay>;
};

function BusinessDayRow({
  prefix,
  label,
  day,
}: {
  prefix: string;
  label: string;
  day: HoursGridDay;
}) {
  const [isClosed, setIsClosed] = useState(day.is_closed);

  return (
    <div className="grid gap-3 rounded-lg border border-border px-3 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
      <p className="text-sm font-medium">{label}</p>
      <div className="space-y-1">
        <Label className="sm:hidden" htmlFor={`${prefix}${day.weekday}-open`}>
          Open
        </Label>
        <input
          id={`${prefix}${day.weekday}-open`}
          name={`${prefix}${day.weekday}-open`}
          type="time"
          required
          disabled={isClosed}
          defaultValue={toTimeInputValue(day.open_time)}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="space-y-1">
        <Label className="sm:hidden" htmlFor={`${prefix}${day.weekday}-close`}>
          Close
        </Label>
        <input
          id={`${prefix}${day.weekday}-close`}
          name={`${prefix}${day.weekday}-close`}
          type="time"
          required
          disabled={isClosed}
          defaultValue={toTimeInputValue(day.close_time)}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <Label className="text-xs text-muted-foreground">Closed</Label>
        <input
          type="hidden"
          name={`${prefix}${day.weekday}-closed`}
          value={isClosed ? "true" : "false"}
        />
        <Switch checked={isClosed} onCheckedChange={setIsClosed} />
      </div>
    </div>
  );
}

function EmployeeDayRow({
  prefix,
  label,
  day,
  initialMode,
  inherited,
}: {
  prefix: string;
  label: string;
  day: HoursGridDay;
  initialMode: "inherit" | "custom";
  inherited: HoursGridDay;
}) {
  const [mode, setMode] = useState(initialMode);
  const [isClosed, setIsClosed] = useState(day.is_closed);
  const isCustom = mode === "custom";

  return (
    <div className="space-y-3 rounded-lg border border-border px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {!isCustom ? (
            <p className="text-xs text-muted-foreground">
              Uses business default
              {inherited.is_closed
                ? " · Closed"
                : ` · ${toTimeInputValue(inherited.open_time)} – ${toTimeInputValue(inherited.close_time)}`}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Custom hours</Label>
          <input
            type="hidden"
            name={`${prefix}${day.weekday}-mode`}
            value={mode}
          />
          <Switch
            checked={isCustom}
            onCheckedChange={(checked) =>
              setMode(checked ? "custom" : "inherit")
            }
          />
        </div>
      </div>

      {isCustom ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
          <div className="space-y-1">
            <Label htmlFor={`${prefix}${day.weekday}-open`}>Open</Label>
            <input
              id={`${prefix}${day.weekday}-open`}
              name={`${prefix}${day.weekday}-open`}
              type="time"
              required
              disabled={isClosed}
              defaultValue={toTimeInputValue(day.open_time)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${prefix}${day.weekday}-close`}>Close</Label>
            <input
              id={`${prefix}${day.weekday}-close`}
              name={`${prefix}${day.weekday}-close`}
              type="time"
              required
              disabled={isClosed}
              defaultValue={toTimeInputValue(day.close_time)}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Closed all day
            </Label>
            <input
              type="hidden"
              name={`${prefix}${day.weekday}-closed`}
              value={isClosed ? "true" : "false"}
            />
            <Switch checked={isClosed} onCheckedChange={setIsClosed} />
          </div>
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name={`${prefix}${day.weekday}-open`}
            value={toTimeInputValue(inherited.open_time)}
          />
          <input
            type="hidden"
            name={`${prefix}${day.weekday}-close`}
            value={toTimeInputValue(inherited.close_time)}
          />
          <input
            type="hidden"
            name={`${prefix}${day.weekday}-closed`}
            value={inherited.is_closed ? "true" : "false"}
          />
        </>
      )}
    </div>
  );
}

export function HoursGrid({
  prefix,
  days,
  showMode = false,
  initialModeByWeekday,
  inheritedByWeekday,
}: HoursGridProps) {
  const dayByWeekday = new Map(days.map((day) => [day.weekday, day]));

  return (
    <div className="space-y-2">
      {!showMode ? (
        <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid">
          <span>Day</span>
          <span>Open</span>
          <span>Close</span>
          <span>Closed</span>
        </div>
      ) : null}
      {WEEKDAYS.map(({ value: weekday, label }) => {
        const day = dayByWeekday.get(weekday);
        if (!day) {
          return null;
        }

        if (showMode) {
          const inherited = inheritedByWeekday?.get(weekday) ?? day;
          const mode = initialModeByWeekday?.get(weekday) ?? "inherit";

          return (
            <EmployeeDayRow
              key={weekday}
              prefix={prefix}
              label={label}
              day={day}
              initialMode={mode}
              inherited={inherited}
            />
          );
        }

        return (
          <BusinessDayRow key={weekday} prefix={prefix} label={label} day={day} />
        );
      })}
    </div>
  );
}

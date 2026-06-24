"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addDays,
  addWeeks,
  format,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { ManualBookingForm } from "@/components/bookings/manual-booking-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  formatBookingDate,
  formatPrice,
  formatSlotTime,
} from "@/lib/booking/format";
import {
  fetchOwnerRescheduleSlots,
  rescheduleOwnerBooking,
  updateBookingStatus,
} from "@/lib/bookings/actions";
import type { BookingListItem } from "@/lib/bookings/types";
import { isActiveBookingStatus } from "@/lib/bookings/utils";
import type { Employee } from "@/lib/employees/queries";
import type { Service } from "@/lib/services/queries";

type CalendarViewProps = {
  bookings: BookingListItem[];
  timezone: string;
  currency: string;
  employees: Employee[];
  services: Service[];
  initialDate: string;
};

type ViewMode = "day" | "week";

function groupByDay(
  bookings: BookingListItem[],
  timezone: string
): Map<string, BookingListItem[]> {
  const map = new Map<string, BookingListItem[]>();

  for (const booking of bookings) {
    const dayKey = formatInTimeZone(
      new Date(booking.starts_at),
      timezone,
      "yyyy-MM-dd"
    );
    const list = map.get(dayKey) ?? [];
    list.push(booking);
    map.set(dayKey, list);
  }

  return map;
}

function BookingActions({
  booking,
  timezone,
  onUpdated,
}: {
  booking: BookingListItem;
  timezone: string;
  onUpdated: () => void;
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [slots, setSlots] = useState<Array<{ startsAt: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runStatus(status: BookingListItem["status"]) {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus({ bookingId: booking.id, status });
      if (result.error) {
        setError(result.error);
        return;
      }
      onUpdated();
    });
  }

  function loadSlots(date: string) {
    setSlots([]);
    setError(null);

    startTransition(async () => {
      const result = await fetchOwnerRescheduleSlots({
        bookingId: booking.id,
        date,
      });

      if (result.ok) {
        setSlots(result.slots);
      } else {
        setError(result.error);
      }
    });
  }

  function runReschedule(startsAt: string) {
    setError(null);
    startTransition(async () => {
      const result = await rescheduleOwnerBooking({
        bookingId: booking.id,
        startsAt,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setRescheduleOpen(false);
      onUpdated();
    });
  }

  const active = isActiveBookingStatus(booking.status);

  return (
    <div className="space-y-3 border-t pt-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {active ? (
        <div className="flex flex-wrap gap-2">
          {booking.status === "pending" ? (
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => runStatus("confirmed")}
            >
              Confirm
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setRescheduleOpen((open) => !open)}
          >
            Reschedule
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => runStatus("cancelled")}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {booking.status === "confirmed" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => runStatus("completed")}
          >
            Mark completed
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => runStatus("no_show")}
          >
            No-show
          </Button>
        </div>
      ) : null}

      {rescheduleOpen && active ? (
        <div className="space-y-2 rounded-lg bg-muted/40 p-3">
          <Label htmlFor={`reschedule-${booking.id}`}>Pick a new date</Label>
          <input
            id={`reschedule-${booking.id}`}
            type="date"
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            onChange={(event) => loadSlots(event.target.value)}
          />
          {isPending ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.startsAt}
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => runReschedule(slot.startsAt)}
              >
                {formatSlotTime(slot.startsAt, timezone)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BookingCard({
  booking,
  timezone,
  currency,
  selected,
  onSelect,
  onUpdated,
}: {
  booking: BookingListItem;
  timezone: string;
  currency: string;
  selected: boolean;
  onSelect: () => void;
  onUpdated: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? "border-sky-300 bg-sky-50/80"
          : "border-sky-100 bg-card hover:border-sky-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{booking.client.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {formatSlotTime(booking.starts_at, timezone)} ·{" "}
            {booking.service.name}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {booking.employee.full_name} ·{" "}
        {formatPrice(Number(booking.price), currency)}
        {booking.source === "manual" ? " · Manual" : ""}
      </p>
      {selected ? (
        <div className="mt-3" onClick={(event) => event.stopPropagation()}>
          <BookingActions
            booking={booking}
            timezone={timezone}
            onUpdated={onUpdated}
          />
        </div>
      ) : null}
    </button>
  );
}

export function CalendarView({
  bookings,
  timezone,
  currency,
  employees,
  services,
  initialDate,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [, startRefresh] = useTransition();

  const zonedAnchor = toZonedTime(new Date(`${anchorDate}T12:00:00`), timezone);

  const visibleDays = useMemo(() => {
    if (viewMode === "day") {
      return [anchorDate];
    }

    const weekStart = startOfWeek(zonedAnchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(weekStart, index), "yyyy-MM-dd")
    );
  }, [anchorDate, viewMode, zonedAnchor]);

  const filteredBookings = useMemo(() => {
    const daySet = new Set(visibleDays);
    return bookings.filter((booking) => {
      const dayKey = formatInTimeZone(
        new Date(booking.starts_at),
        timezone,
        "yyyy-MM-dd"
      );
      return daySet.has(dayKey);
    });
  }, [bookings, timezone, visibleDays]);

  const grouped = groupByDay(filteredBookings, timezone);

  function navigate(direction: -1 | 1) {
    const current = new Date(`${anchorDate}T12:00:00`);
    const next =
      viewMode === "day"
        ? direction === 1
          ? addDays(current, 1)
          : subDays(current, 1)
        : direction === 1
          ? addWeeks(current, 1)
          : subWeeks(current, 1);

    setAnchorDate(format(next, "yyyy-MM-dd"));
    setSelectedId(null);
  }

  function handleUpdated() {
    startRefresh(() => {
      window.location.reload();
    });
  }

  const rangeLabel =
    viewMode === "day"
      ? formatInTimeZone(
          new Date(`${anchorDate}T12:00:00`),
          timezone,
          "EEEE, MMM d, yyyy"
        )
      : `${formatInTimeZone(
          new Date(`${visibleDays[0]}T12:00:00`),
          timezone,
          "MMM d"
        )} – ${formatInTimeZone(
          new Date(`${visibleDays[6]}T12:00:00`),
          timezone,
          "MMM d, yyyy"
        )}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-sky-100 p-1">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "day" ? "default" : "ghost"}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "week" ? "default" : "ghost"}
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" onClick={() => setShowManualForm((open) => !open)}>
            <Plus className="size-4" />
            Add booking
          </Button>
        </div>
      </div>

      {showManualForm ? (
        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle>Manual booking</CardTitle>
            <CardDescription>Walk-in or phone reservation</CardDescription>
          </CardHeader>
          <CardContent>
            <ManualBookingForm
              employees={employees}
              services={services}
              timezone={timezone}
              onSuccess={() => {
                setShowManualForm(false);
                handleUpdated();
              }}
              onCancel={() => setShowManualForm(false)}
            />
          </CardContent>
        </Card>
      ) : null}

      {viewMode === "week" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleDays.map((day) => {
            const dayBookings = grouped.get(day) ?? [];
            return (
              <Card key={day} className="border-sky-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {formatInTimeZone(
                      new Date(`${day}T12:00:00`),
                      timezone,
                      "EEE, MMM d"
                    )}
                  </CardTitle>
                  <CardDescription>
                    {dayBookings.length} appointment
                    {dayBookings.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings</p>
                  ) : (
                    dayBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        timezone={timezone}
                        currency={currency}
                        selected={selectedId === booking.id}
                        onSelect={() =>
                          setSelectedId((id) =>
                            id === booking.id ? null : booking.id
                          )
                        }
                        onUpdated={handleUpdated}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {(grouped.get(anchorDate) ?? []).length === 0 ? (
            <Card className="border-sky-100">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No bookings for {formatBookingDate(`${anchorDate}T12:00:00`, timezone)}
              </CardContent>
            </Card>
          ) : (
            (grouped.get(anchorDate) ?? []).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                timezone={timezone}
                currency={currency}
                selected={selectedId === booking.id}
                onSelect={() =>
                  setSelectedId((id) => (id === booking.id ? null : booking.id))
                }
                onUpdated={handleUpdated}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

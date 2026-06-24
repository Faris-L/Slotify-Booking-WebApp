"use client";

import { useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
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
import { getBookableDates } from "@/lib/booking/slots";
import {
  cancelBookingByToken,
  fetchManageSlots,
  rescheduleBookingByToken,
} from "@/lib/manage/actions";
import type { ManageBookingView } from "@/lib/manage/queries";
import {
  canClientModifyBooking,
  isActiveBookingStatus,
} from "@/lib/bookings/utils";

type ManageBookingPanelProps = {
  booking: ManageBookingView;
};

export function ManageBookingPanel({ booking: initial }: ManageBookingPanelProps) {
  const [booking, setBooking] = useState(initial);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<Array<{ startsAt: string }>>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { business } = booking;
  const canModify =
    isActiveBookingStatus(booking.status) &&
    canClientModifyBooking(booking.starts_at, business.cancel_cutoff_hours);

  const bookableDates = getBookableDates(
    business.timezone,
    business.max_horizon_days
  );

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSlots([]);
    setSlotsError(null);

    if (!date) {
      return;
    }

    startTransition(async () => {
      const result = await fetchManageSlots({
        manageToken: booking.manage_token,
        date,
      });

      if (result.ok) {
        setSlots(result.slots);
      } else {
        setSlotsError(result.error);
      }
    });
  }

  function handleCancel() {
    if (!confirm("Cancel this appointment?")) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await cancelBookingByToken({
        manageToken: booking.manage_token,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setBooking((prev) => ({ ...prev, status: "cancelled" }));
      setMode("view");
      setMessage(result.success ?? "Booking cancelled");
    });
  }

  function handleReschedule(startsAt: string) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await rescheduleBookingByToken({
        manageToken: booking.manage_token,
        startsAt,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setBooking((prev) => ({ ...prev, starts_at: startsAt }));
      setMode("view");
      setMessage(result.success ?? "Booking rescheduled");
    });
  }

  if (booking.status === "cancelled") {
    return (
      <Card className="mx-auto max-w-lg border-sky-100">
        <CardHeader>
          <CardTitle>Booking cancelled</CardTitle>
          <CardDescription>
            This appointment at {business.name} was cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            {booking.service.name} with {booking.employee.full_name}
          </p>
          <p className="mt-1">
            {formatBookingDate(booking.starts_at, business.timezone)} at{" "}
            {formatSlotTime(booking.starts_at, business.timezone)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg border-sky-100">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Your booking</CardTitle>
            <CardDescription>{business.name}</CardDescription>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-sky-50/60 p-4 text-sm">
          <p className="font-semibold text-foreground">{booking.service.name}</p>
          <p className="text-muted-foreground">
            with {booking.employee.full_name}
          </p>
          <p className="mt-2 font-medium">
            {formatBookingDate(booking.starts_at, business.timezone)}
          </p>
          <p>{formatSlotTime(booking.starts_at, business.timezone)}</p>
          <p className="mt-2">
            {formatPrice(Number(booking.price), business.currency)}
          </p>
        </div>

        {message ? (
          <p className="text-sm text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!canModify && isActiveBookingStatus(booking.status) ? (
          <p className="text-sm text-muted-foreground">
            Changes must be made at least {business.cancel_cutoff_hours} hours
            before the appointment. Contact {business.name} for help.
          </p>
        ) : null}

        {canModify && mode === "view" ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setMode("reschedule")}
              disabled={isPending}
            >
              Reschedule
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel booking
            </Button>
          </div>
        ) : null}

        {canModify && mode === "reschedule" ? (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New date</Label>
              <select
                id="reschedule-date"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              >
                <option value="">Select a date</option>
                {bookableDates.map((date) => (
                  <option key={date} value={date}>
                    {formatInTimeZone(
                      new Date(`${date}T12:00:00`),
                      business.timezone,
                      "EEE, MMM d"
                    )}
                  </option>
                ))}
              </select>
            </div>

            {isPending ? (
              <p className="text-sm text-muted-foreground">Loading times…</p>
            ) : null}
            {slotsError ? (
              <p className="text-sm text-destructive">{slotsError}</p>
            ) : null}

            {slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <Button
                    key={slot.startsAt}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleReschedule(slot.startsAt)}
                  >
                    {formatSlotTime(slot.startsAt, business.timezone)}
                  </Button>
                ))}
              </div>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("view")}
            >
              Back
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

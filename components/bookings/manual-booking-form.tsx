"use client";

import { useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSlotTime } from "@/lib/booking/format";
import { getBookableDates } from "@/lib/booking/slots";
import {
  createManualBooking,
  fetchManualBookingSlots,
} from "@/lib/bookings/actions";
import type { Employee } from "@/lib/employees/queries";
import type { Service } from "@/lib/services/queries";

type ManualBookingFormProps = {
  employees: Employee[];
  services: Service[];
  timezone: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function ManualBookingForm({
  employees,
  services,
  timezone,
  onSuccess,
  onCancel,
}: ManualBookingFormProps) {
  const activeEmployees = employees.filter((employee) => employee.is_active);
  const activeServices = services.filter((service) => service.is_active);
  const bookableDates = getBookableDates(timezone, 60);

  const [serviceId, setServiceId] = useState(activeServices[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Array<{ startsAt: string }>>([]);
  const [startsAt, setStartsAt] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadSlots(selectedDate: string) {
    setDate(selectedDate);
    setStartsAt("");
    setSlots([]);
    setError(null);

    if (!selectedDate || !employeeId || !serviceId) {
      return;
    }

    startTransition(async () => {
      const result = await fetchManualBookingSlots({
        serviceId,
        employeeId,
        date: selectedDate,
      });

      if (result.ok) {
        setSlots(result.slots);
      } else {
        setError(result.error);
      }
    });
  }

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    if (date) {
      loadSlots(date);
    }
  }

  function handleEmployeeChange(nextEmployeeId: string) {
    setEmployeeId(nextEmployeeId);
    if (date) {
      loadSlots(date);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!startsAt) {
      setError("Select a time slot");
      return;
    }

    startTransition(async () => {
      const result = await createManualBooking({
        serviceId,
        employeeId,
        startsAt,
        clientName,
        clientEmail: clientEmail || undefined,
        clientPhone,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="manual-service">Service</Label>
          <select
            id="manual-service"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={serviceId}
            onChange={(event) => handleServiceChange(event.target.value)}
            required
          >
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-employee">Staff</Label>
          <select
            id="manual-employee"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={employeeId}
            onChange={(event) => handleEmployeeChange(event.target.value)}
            required
          >
            {activeEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manual-date">Date</Label>
        <select
          id="manual-date"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          value={date}
          onChange={(event) => loadSlots(event.target.value)}
          required
        >
          <option value="">Select a date</option>
          {bookableDates.map((bookableDate) => (
            <option key={bookableDate} value={bookableDate}>
              {formatInTimeZone(
                new Date(`${bookableDate}T12:00:00`),
                timezone,
                "EEE, MMM d"
              )}
            </option>
          ))}
        </select>
      </div>

      {isPending && date ? (
        <p className="text-sm text-muted-foreground">Loading times…</p>
      ) : null}

      {slots.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.startsAt}
              type="button"
              variant={startsAt === slot.startsAt ? "default" : "outline"}
              size="sm"
              onClick={() => setStartsAt(slot.startsAt)}
            >
              {formatSlotTime(slot.startsAt, timezone)}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="manual-name">Client name</Label>
          <Input
            id="manual-name"
            required
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-email">Email (optional)</Label>
          <Input
            id="manual-email"
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-phone">Phone</Label>
          <Input
            id="manual-phone"
            required
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Create booking"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

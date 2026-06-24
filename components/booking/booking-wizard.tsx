"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { formatInTimeZone } from "date-fns-tz";

import { BusinessHeader } from "@/components/booking/business-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBooking,
  fetchAvailableSlots,
  type CreateBookingResult,
} from "@/lib/booking/actions";
import {
  formatBookingDate,
  formatDuration,
  formatPrice,
  formatSlotTime,
} from "@/lib/booking/format";
import type { PublicCatalog } from "@/lib/booking/queries";
import {
  getEffectiveDuration,
  getEffectivePrice,
  getEmployeesForService,
  getServiceOffering,
} from "@/lib/booking/queries";
import { getBookableDates } from "@/lib/booking/slots";

type BookingWizardProps = {
  catalog: PublicCatalog;
  initialServiceId?: string;
  backHref: string;
};

type WizardStep = "service" | "staff" | "datetime" | "contact" | "done";

type SelectedSlot = {
  startsAt: string;
  employeeId: string;
};

const ANY_STAFF = "any";

export function BookingWizard({
  catalog,
  initialServiceId,
  backHref,
}: BookingWizardProps) {
  const { business } = catalog;

  const initialService = catalog.services.find(
    (service) => service.id === initialServiceId
  );

  const [step, setStep] = useState<WizardStep>(
    initialService ? "staff" : "service"
  );
  const [serviceId, setServiceId] = useState<string | null>(
    initialService?.id ?? null
  );
  const [staffSelection, setStaffSelection] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SelectedSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateBookingResult | null>(null);
  const [isLoadingSlots, startSlotsTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const selectedService = catalog.services.find(
    (service) => service.id === serviceId
  );

  const staffOptions = useMemo(() => {
    if (!serviceId) {
      return [];
    }
    return getEmployeesForService(catalog, serviceId);
  }, [catalog, serviceId]);

  const bookableDates = useMemo(
    () => getBookableDates(business.timezone, business.max_horizon_days),
    [business.max_horizon_days, business.timezone]
  );

  const loadSlots = useCallback(
    (date: string, staff: string) => {
      if (!serviceId) {
        return;
      }

      setSlotsError(null);
      setSelectedSlot(null);

      startSlotsTransition(async () => {
        const response = await fetchAvailableSlots({
          businessId: business.id,
          serviceId,
          date,
          employeeId: staff === ANY_STAFF ? "any" : staff,
        });

        if (!response.ok) {
          setSlots([]);
          setSlotsError(response.error);
          return;
        }

        setSlots(response.slots);
        if (response.slots.length === 0) {
          setSlotsError("No available times on this day. Try another date.");
        }
      });
    },
    [business.id, serviceId, startSlotsTransition]
  );

  function handleServiceSelect(id: string) {
    setServiceId(id);
    setStaffSelection(null);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep("staff");
  }

  function handleStaffSelect(staff: string) {
    setStaffSelection(staff);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setStep("datetime");
  }

  function handleDateSelect(date: string) {
    if (!staffSelection) {
      return;
    }

    setSelectedDate(date);
    loadSlots(date, staffSelection);
  }

  function handleSlotSelect(slot: SelectedSlot) {
    setSelectedSlot(slot);
    setSubmitError(null);
    setStep("contact");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceId || !selectedSlot) {
      return;
    }

    setSubmitError(null);

    startSubmitTransition(async () => {
      const response = await createBooking({
        businessId: business.id,
        serviceId,
        employeeId: selectedSlot.employeeId,
        startsAt: selectedSlot.startsAt,
        clientName: contact.name,
        clientEmail: contact.email,
        clientPhone: contact.phone,
      });

      if (!response.ok) {
        setSubmitError(response.error);
        if (response.conflict && selectedDate && staffSelection) {
          loadSlots(selectedDate, staffSelection);
          setStep("datetime");
          setSelectedSlot(null);
        }
        return;
      }

      setResult(response);
      setStep("done");
    });
  }

  if (step === "done" && result?.ok) {
    const employee = catalog.employees.find(
      (item) => item.id === selectedSlot?.employeeId
    );
    const confirmed = result.booking.status === "confirmed";

    return (
      <div className="min-h-screen bg-background">
        <BusinessHeader catalog={catalog} />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle>
                {confirmed ? "Booking confirmed" : "Request received"}
              </CardTitle>
              <CardDescription>
                {confirmed
                  ? "Your appointment is confirmed. We sent a confirmation email with a link to manage your booking."
                  : "Your request is pending approval. You will receive an email once the business confirms your appointment."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {selectedService && selectedSlot ? (
                <div className="rounded-xl bg-sky-50 p-4 text-sky-950">
                  <p className="font-semibold">{selectedService.name}</p>
                  {employee ? (
                    <p className="text-sky-800">with {employee.full_name}</p>
                  ) : null}
                  <p className="mt-2">
                    {formatBookingDate(
                      result.booking.startsAt,
                      business.timezone
                    )}
                  </p>
                  <p>
                    {formatSlotTime(result.booking.startsAt, business.timezone)}
                  </p>
                </div>
              ) : null}
              {!result.emailSent ? (
                <p className="text-muted-foreground">
                  Email could not be sent (not configured). Save your manage
                  link:
                </p>
              ) : null}
              <Button
                nativeButton={false}
                className="w-full"
                render={<Link href={`/manage/${result.booking.manageToken}`} />}
              >
                Manage booking
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                className="w-full"
                render={<Link href={backHref} />}
              >
                Back to {business.name}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BusinessHeader catalog={catalog} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step{" "}
              {step === "service"
                ? 1
                : step === "staff"
                  ? 2
                  : step === "datetime"
                    ? 3
                    : 4}{" "}
              of 4
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {step === "service" && "Choose a service"}
              {step === "staff" && "Choose staff"}
              {step === "datetime" && "Pick date & time"}
              {step === "contact" && "Your details"}
            </h2>
          </div>
          <Button
            nativeButton={false}
            variant="ghost"
            size="sm"
            render={<Link href={backHref} />}
          >
            Cancel
          </Button>
        </div>

        {step === "service" && (
          <div className="grid gap-3">
            {catalog.services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceSelect(service.id)}
                className="rounded-xl border border-sky-100 bg-card p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{service.name}</p>
                    {service.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="secondary">
                    {formatDuration(service.duration_minutes)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium">
                  {formatPrice(service.price, business.currency)}
                </p>
              </button>
            ))}
          </div>
        )}

        {step === "staff" && selectedService && (
          <div className="space-y-3">
            <Card className="border-sky-100 bg-sky-50/40">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{selectedService.name}</p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => setStep("service")}
                >
                  Change service
                </Button>
              </CardContent>
            </Card>

            {business.allow_any_employee && staffOptions.length > 1 ? (
              <button
                type="button"
                onClick={() => handleStaffSelect(ANY_STAFF)}
                className="w-full rounded-xl border border-sky-100 bg-card p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
              >
                <p className="font-semibold text-foreground">Any available</p>
                <p className="text-sm text-muted-foreground">
                  We will match you with the next available staff member.
                </p>
              </button>
            ) : null}

            {staffOptions.map((employee) => {
              const offering = getServiceOffering(
                catalog,
                selectedService.id,
                employee.id
              );
              const price = getEffectivePrice(selectedService, offering);
              const duration = getEffectiveDuration(selectedService, offering);

              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleStaffSelect(employee.id)}
                  className="w-full rounded-xl border border-sky-100 bg-card p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">
                      {employee.full_name}
                    </p>
                    <Badge variant="secondary">{formatDuration(duration)}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium">
                    {formatPrice(price, business.currency)}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {step === "datetime" && selectedService && staffSelection && (
          <div className="space-y-4">
            <Card className="border-sky-100 bg-sky-50/40">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-muted-foreground">
                  {staffSelection === ANY_STAFF
                    ? "Any available staff"
                    : staffOptions.find((e) => e.id === staffSelection)
                        ?.full_name}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => setStep("staff")}
                >
                  Change staff
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="booking-date">Date</Label>
              <select
                id="booking-date"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                value={selectedDate ?? ""}
                onChange={(event) => handleDateSelect(event.target.value)}
              >
                <option value="" disabled>
                  Select a date
                </option>
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

            {isLoadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading times…</p>
            ) : null}

            {slotsError ? (
              <p className="text-sm text-destructive">{slotsError}</p>
            ) : null}

            {selectedDate && slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <Button
                    key={`${slot.startsAt}-${slot.employeeId}`}
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {formatSlotTime(slot.startsAt, business.timezone)}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {step === "contact" && selectedService && selectedSlot && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="border-sky-100 bg-sky-50/40">
              <CardContent className="space-y-1 p-4 text-sm">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-muted-foreground">
                  {formatBookingDate(selectedSlot.startsAt, business.timezone)}{" "}
                  at {formatSlotTime(selectedSlot.startsAt, business.timezone)}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => setStep("datetime")}
                >
                  Change time
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="client-name">Full name</Label>
              <Input
                id="client-name"
                required
                value={contact.name}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                required
                value={contact.email}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                type="tel"
                required
                value={contact.phone}
                onChange={(event) =>
                  setContact((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Booking…" : "Confirm booking"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

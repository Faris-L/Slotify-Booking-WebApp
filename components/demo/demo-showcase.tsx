import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { BrandMark } from "@/components/layout/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSlotTime } from "@/lib/booking/format";
import {
  DEMO_BUSINESS,
  DEMO_CLIENTS,
  DEMO_DASHBOARD_STATS,
  DEMO_LANDING_BOOKING,
  DEMO_SERVICES,
  DEMO_TODAY_APPOINTMENTS,
  DEMO_WEEK_HIGHLIGHTS,
} from "@/lib/demo/mock-data";

export function DemoShowcase() {
  const { timezone, slug, name } = DEMO_BUSINESS;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Screenshot demo</Badge>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/" />}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Back to home
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-5 py-10 sm:px-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {name} — Dashboard preview
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sample data for marketing screenshots. Not connected to your account.
          </p>
        </div>

        <StatsOverview stats={DEMO_DASHBOARD_STATS} slug={slug} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s schedule</CardTitle>
              <CardDescription>
                {formatInTimeZone(new Date(), timezone, "EEEE, MMMM d")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_TODAY_APPOINTMENTS.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-sky-100 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {formatSlotTime(booking.starts_at, timezone)} ·{" "}
                      {booking.client.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.service.name} with {booking.employee.full_name}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="text-base">This week at a glance</CardTitle>
              <CardDescription>Appointments per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {DEMO_WEEK_HIGHLIGHTS.map(({ day, count }) => (
                  <div
                    key={day}
                    className="rounded-lg border border-sky-100 bg-sky-50/50 px-2 py-3 text-center"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {day}
                    </p>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-sky-100">
          <CardHeader>
            <CardTitle className="text-base">Recent clients</CardTitle>
            <CardDescription>CRM-lite client list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium text-right">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_CLIENTS.map((client) => (
                    <tr key={client.id} className="border-b border-border/60">
                      <td className="py-3 font-medium">{client.full_name}</td>
                      <td className="py-3 text-muted-foreground">
                        {client.email}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {client.phone ?? "—"}
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {client.booking_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="text-base">Public booking page</CardTitle>
              <CardDescription>What your clients see at /{slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_SERVICES.map((group) => (
                <div key={group.category}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.duration}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          {service.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-sky-100 p-0">
            <div
              className="px-5 py-4 text-white"
              style={{ backgroundColor: DEMO_BUSINESS.brandColor }}
            >
              <p className="font-semibold">{DEMO_LANDING_BOOKING.businessName}</p>
              <p className="text-sm text-white/80">Book an appointment</p>
            </div>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Service
                </p>
                <div className="mt-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <p className="font-medium">
                    {DEMO_LANDING_BOOKING.serviceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {DEMO_LANDING_BOOKING.duration} · {DEMO_LANDING_BOOKING.price}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Available times
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {DEMO_LANDING_BOOKING.times.map((time, i) => (
                    <div
                      key={time}
                      className={`rounded-lg border px-2 py-2.5 text-center text-sm font-medium ${
                        i === DEMO_LANDING_BOOKING.selectedTimeIndex
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border"
                      }`}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">
                Confirm booking
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
